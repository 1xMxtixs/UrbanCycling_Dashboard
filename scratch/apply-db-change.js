import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Applying manual SQL updates to bicicletas table...");

    // 1. Drop foreign key
    try {
      await prisma.$executeRawUnsafe(
        "ALTER TABLE `bicicletas` DROP FOREIGN KEY `bicicletas_id_orden_de_trabajo_fkey`"
      );
      console.log("Dropped foreign key `bicicletas_id_orden_de_trabajo_fkey` successfully.");
    } catch (e) {
      console.log("Foreign key drop skipped or failed (might not exist yet):", e.message);
    }

    // 2. Drop unique index
    try {
      await prisma.$executeRawUnsafe(
        "DROP INDEX `bicicletas_id_orden_de_trabajo_key` ON `bicicletas`"
      );
      console.log("Dropped unique index `bicicletas_id_orden_de_trabajo_key` successfully.");
    } catch (e) {
      console.log("Unique index drop skipped or failed (might not exist):", e.message);
    }

    // 3. Add column
    try {
      await prisma.$executeRawUnsafe(
        "ALTER TABLE `bicicletas` ADD COLUMN `imagen_url` VARCHAR(512) NULL"
      );
      console.log("Added `imagen_url` column to `bicicletas` successfully.");
    } catch (e) {
      console.log("Add column skipped or failed (might already exist):", e.message);
    }

    // 4. Re-add foreign key
    try {
      await prisma.$executeRawUnsafe(
        "ALTER TABLE `bicicletas` ADD CONSTRAINT `bicicletas_id_orden_de_trabajo_fkey` FOREIGN KEY (`id_orden_de_trabajo`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE"
      );
      console.log("Re-added foreign key `bicicletas_id_orden_de_trabajo_fkey` successfully.");
    } catch (e) {
      console.log("Re-adding foreign key failed:", e.message);
    }

    console.log("SQL updates completed!");
  } catch (err) {
    console.error("Error executing raw SQL:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
