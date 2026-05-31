import { PrismaClient } from "../generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as mariadb from "mariadb";

declare global {
  var prisma: PrismaClient | undefined;
}

// 1. Creamos el pool de conexiones con el driver compatible de MySQL/MariaDB
const connectionString = process.env.DATABASE_URL;
const pool = mariadb.createPool(connectionString!);

// 2. Instanciamos el adaptador oficial de Prisma 7
const adapter = new PrismaMariaDb(pool);

export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;