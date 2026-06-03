import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const rolesCount = await prisma.rol.count();
    const usersCount = await prisma.usuario.count();
    const clientsCount = await prisma.cliente.count();
    const workOrdersCount = await prisma.ordenDeTrabajo.count();

    console.log(`Roles: ${rolesCount}, Users: ${usersCount}, Clients: ${clientsCount}, WorkOrders: ${workOrdersCount}`);
    
    if (clientsCount > 0) {
      const clients = await prisma.cliente.findMany({ take: 5 });
      console.log("Sample Clients:", clients.map(c => ({ id: c.idCliente, rut: c.rut, type: c.tipoCliente, pNombre: c.primerNombre, rSocial: c.razonSocial })));
    }
    
    if (usersCount > 0) {
      const users = await prisma.usuario.findMany({ take: 5 });
      console.log("Sample Users:", users);
    }
    
    if (rolesCount > 0) {
      const roles = await prisma.rol.findMany();
      console.log("Roles:", roles);
    }
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
