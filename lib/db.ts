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

  // Conexión local sin SSL
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