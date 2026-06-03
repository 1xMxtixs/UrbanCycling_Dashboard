import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // 1. Create default role if it doesn't exist
    let rol = await prisma.rol.findFirst({
      where: { nombre: "Administrador" }
    });

    if (!rol) {
      rol = await prisma.rol.create({
        data: {
          nombre: "Administrador",
          descripcion: "Rol de administrador del taller"
        }
      });
      console.log("Created role:", rol);
    } else {
      console.log("Role already exists:", rol);
    }

    // 2. Create default user if it doesn't exist
    let user = await prisma.usuario.findFirst({
      where: { correoElectronico: "contacto@urbancycling.cl" }
    });

    if (!user) {
      user = await prisma.usuario.create({
        data: {
          idRol: rol.idRol,
          primerNombre: "Juan",
          segundoNombre: "Carlos",
          apellidoPaterno: "Perez",
          apellidoMaterno: "Gonzalez",
          rut: "11.111.111-1",
          correoElectronico: "contacto@urbancycling.cl",
          contrasena: "123456", // plain text or hash, doesn't matter for this dev dashboard check
          estado: "activo"
        }
      });
      console.log("Created default user:", user);
    } else {
      console.log("User already exists:", user);
    }
  } catch (err) {
    console.error("Error seeding:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
