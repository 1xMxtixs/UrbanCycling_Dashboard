// prisma/seed.ts
import { PrismaClient } from '../generated/prisma';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';

console.log("⏳ Cargando dependencias del seed...");

async function main() {
  console.log("🔌 Configurando conexión a la base de datos...");
  
  const adapter = new PrismaMariaDb({
    host: "127.0.0.1",
    port: 3307,                              // Puerto de Docker
    user: "cycling_admin",                   // Usuario de Docker
    password: "cycling_secure_password",     // Contraseña de Docker
    database: "urbancycling_db",
    allowPublicKeyRetrieval: true, 
  });

  const prisma = new PrismaClient({ adapter });

  console.log("🛡️ Creando roles base...");
  const adminRole = await prisma.rol.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: { 
      nombre: 'Administrador', 
      descripcion: 'Administrador del sistema',
      estado: 'activo' // <-- Obligatorio según tu TypeScript
    }, 
  });

  await prisma.rol.upsert({
    where: { nombre: 'Sin Rol' },
    update: {},
    create: { 
      nombre: 'Sin Rol', 
      descripcion: 'Usuario nuevo',
      estado: 'activo' // <-- Obligatorio según tu TypeScript
    },
  });

  console.log("👤 Creando usuario administrador...");
  const hash = await bcrypt.hash('admin123', 12);
  
  await prisma.usuario.upsert({
    where: { rut: '12345678-9' },
    update: { 
      contrasenaHash: hash,                  // <-- Cambiado a contrasenaHash
      idRol: adminRole.idRol, 
      correo: 'admin@urbancycling.cl'        // <-- Cambiado a correo
    },
    create: {
      idRol: adminRole.idRol,
      primerNombre: 'Admin',
      apellidoPaterno: 'Urban',
      apellidoMaterno: 'System',             
      rut: '12345678-9',
      correo: 'admin@urbancycling.cl',       // <-- Cambiado a correo
      contrasenaHash: hash,                  // <-- Cambiado a contrasenaHash
      estado: 'activo'
    },
  });

  console.log("✅ Base de datos poblada exitosamente.");
  console.log("---------------------------------------");
  console.log("Usuario : admin@urbancycling.cl");
  console.log("Password: admin123");
  console.log("---------------------------------------");

  await prisma.$disconnect();
}

main().catch(e => {
  console.error("❌ ERROR EN EL SEED:", e);
  process.exit(1);
});
