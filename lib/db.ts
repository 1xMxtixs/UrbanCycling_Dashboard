import { PrismaClient } from "../generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var prisma: PrismaClient | undefined;
}

function createAdapter() {
  // Leemos la URL (sea la normal de .env o la de .env.test)
  const rawUrl = process.env.DATABASE_URL || "mysql://root:root_cycling_pass@127.0.0.1:3306/urbancycling_db";
  
  try {
    const url = new URL(rawUrl);
    
    // Si la URL es de TiDB Cloud, activamos SSL. Si es local, lo apagamos.
    const isTiDB = url.hostname.includes("tidbcloud") || url.hostname.includes("tidb");

    return new PrismaMariaDb({
      host: url.hostname,
      port: parseInt(url.port || "3306", 10),
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1), // Quita el "/" del inicio del nombre de la BD
      ssl: isTiDB,
      connectionLimit: 5,
    });
  } catch (error) {
    console.error("Error parseando DATABASE_URL en lib/db.ts", error);
    throw error;
  }

  // Conexión local sin SSL
  return new PrismaMariaDb(
    rawUrl || "mariadb://mock_user:mock_pass@localhost:3306/mock_db"
  );
}

// Ahora Prisma SIEMPRE usa el adaptador, tanto en local como en producción
const adapter = createAdapter();
export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;