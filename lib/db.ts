import { PrismaClient } from "../generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var prisma: PrismaClient | undefined;
}

// 1. Creamos el pool de conexiones con el driver compatible de MySQL/MariaDB
const connectionString = process.env.DATABASE_URL;

// 2. Instanciamos el adaptador oficial de Prisma 7
const adapter = new PrismaMariaDb(connectionString!);

export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;