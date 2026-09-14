import { PrismaClient } from "../generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var prisma: PrismaClient | undefined;
}

// Construye la conexión a TiDB Cloud con SSL habilitado
function createAdapter() {
  const rawUrl = process.env.DATABASE_URL || "";
  const isTiDB = rawUrl.includes("tidbcloud.com") || rawUrl.includes("tidb");

  if (isTiDB) {
    // Parsear la URL: mysql://user:pass@host:port/dbname?...
    const withoutProtocol = rawUrl.replace(/^mysql:\/\//, "");
    const [credentials, rest] = withoutProtocol.split("@");
    const [user, password] = credentials.split(":");
    const [hostPort, dbWithQuery] = rest.split("/");
    const [host, portStr] = hostPort.split(":");
    const database = dbWithQuery.split("?")[0];
    const port = parseInt(portStr || "4000", 10);

    return new PrismaMariaDb({
      host,
      port,
      user,
      password,
      database,
      ssl: true,
      connectionLimit: 5,
    });
  }

  // Managed MySQL (e.g. Aiven) needs TLS verified against its own CA.
  // Env vars may store the PEM with escaped newlines.
  const caCert = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  const requiresSsl = /[?&]ssl-mode=required/i.test(rawUrl);
  const ssl = caCert ? { ca: caCert } : requiresSsl ? true : undefined;

  // Conexión MySQL estándar (local sin SSL, o gestionada con SSL)
  try {
    const cleanUrl = rawUrl || "mysql://mock_user:mock_pass@localhost:3306/mock_db";
    const withoutProtocol = cleanUrl.replace(/^(mysql|mariadb):\/\//, "");
    const [credentials, rest] = withoutProtocol.split("@");
    const [user, password] = credentials.split(":");
    const [hostPort, dbWithQuery] = rest.split("/");
    const [host, portStr] = hostPort.split(":");
    const database = dbWithQuery.split("?")[0];
    const port = parseInt(portStr || "3306", 10);

    return new PrismaMariaDb({
      host,
      port,
      user,
      password,
      database,
      allowPublicKeyRetrieval: true,
      connectionLimit: 10,
      // TLS handshake to a remote host can exceed the 1s driver default
      connectTimeout: 10000,
      ssl,
    });
  } catch (e) {
    return new PrismaMariaDb(
      rawUrl || "mariadb://mock_user:mock_pass@localhost:3306/mock_db"
    );
  }
}

const adapter = createAdapter();

export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;