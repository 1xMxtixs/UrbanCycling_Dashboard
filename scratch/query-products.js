import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const productsCount = await prisma.producto.count();
    const servicesCount = await prisma.servicio.count();

    console.log(`Products in DB: ${productsCount}, Services in DB: ${servicesCount}`);

    if (productsCount > 0) {
      const products = await prisma.producto.findMany();
      console.log("Sample Products:", products.map(p => ({ id: p.idProducto, nombre: p.nombre, precio: p.precioVenta, stock: p.stockActual, estado: p.estado })));
    }

    if (servicesCount > 0) {
      const services = await prisma.servicio.findMany();
      console.log("Sample Services:", services);
    }
  } catch (err) {
    console.error("Error querying products/services:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
