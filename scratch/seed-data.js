import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Seeding started...");

    // 1. Create Default Role
    let rol = await prisma.rol.findFirst({ where: { nombre: "Administrador" } });
    if (!rol) {
      rol = await prisma.rol.create({
        data: {
          nombre: "Administrador",
          descripcion: "Rol de administrador del taller"
        }
      });
      console.log("Created role:", rol.nombre);
    }

    // 2. Create Default User
    let user = await prisma.usuario.findFirst({ where: { correoElectronico: "contacto@urbancycling.cl" } });
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
          contrasena: "123456",
          estado: "activo"
        }
      });
      console.log("Created default user:", user.primerNombre);
    }

    // 3. Create Clients
    let c1 = await prisma.cliente.findUnique({ where: { rut: "12.345.678-9" } });
    if (!c1) {
      c1 = await prisma.cliente.create({
        data: {
          tipoCliente: "natural",
          rut: "12.345.678-9",
          primerNombre: "Sebastian",
          apellidoPaterno: "Munoz",
          estado: "activo",
          telefonos: { create: { telefono: "+56912345678" } }
        }
      });
      console.log("Created client 1:", c1.primerNombre);
    }

    let c2 = await prisma.cliente.findUnique({ where: { rut: "76.123.456-K" } });
    if (!c2) {
      c2 = await prisma.cliente.create({
        data: {
          tipoCliente: "juridica",
          rut: "76.123.456-K",
          razonSocial: "Samsung Electronics Co",
          estado: "activo",
          telefonos: { create: { telefono: "+56298765432" } }
        }
      });
      console.log("Created client 2:", c2.razonSocial);
    }

    let c3 = await prisma.cliente.findUnique({ where: { rut: "15.987.654-3" } });
    if (!c3) {
      c3 = await prisma.cliente.create({
        data: {
          tipoCliente: "natural",
          rut: "15.987.654-3",
          primerNombre: "Maria",
          apellidoPaterno: "Alvarez",
          estado: "activo",
          telefonos: { create: { telefono: "+56987654321" } }
        }
      });
      console.log("Created client 3:", c3.primerNombre);
    }

    // 4. Create Generic Service
    let sTaller = await prisma.servicio.findUnique({ where: { nombre: "Servicio de Taller" } });
    if (!sTaller) {
      sTaller = await prisma.servicio.create({
        data: {
          nombre: "Servicio de Taller",
          descripcion: "Mano de obra y servicios técnicos generales",
          precioVenta: 0,
          estado: "activo"
        }
      });
      console.log("Created generic service:", sTaller.nombre);
    }

    // 5. Create Sample Products
    const sampleProducts = [
      { tipoProducto: "Repuesto", nombre: "Neumático Maxxis Ardent 29x2.25", precioVenta: 35000, stockActual: 10, stockMinimo: 2, estado: "activo" },
      { tipoProducto: "Repuesto", nombre: "Cadena Shimano Deore 11v", precioVenta: 25000, stockActual: 15, stockMinimo: 3, estado: "activo" },
      { tipoProducto: "Repuesto", nombre: "Pastillas de freno Shimano B05S", precioVenta: 12000, stockActual: 30, stockMinimo: 5, estado: "activo" },
      { tipoProducto: "Accesorio", nombre: "Cámara de aire 29", precioVenta: 6000, stockActual: 50, stockMinimo: 10, estado: "activo" },
      { tipoProducto: "Accesorio", nombre: "Cinta de manubrio Pro", precioVenta: 15000, stockActual: 8, stockMinimo: 2, estado: "activo" }
    ];

    for (const p of sampleProducts) {
      let prod = await prisma.producto.findUnique({ where: { nombre: p.nombre } });
      if (!prod) {
        prod = await prisma.producto.create({ data: p });
        console.log("Created product:", prod.nombre);
      }
    }

    // Clear existing Work Orders to avoid duplicates in seed runs
    await prisma.lineaDeOrdenDeTrabajo.deleteMany();
    await prisma.bicicleta.deleteMany();
    await prisma.ordenDeTrabajo.deleteMany();

    const now = new Date();

    // 6. Create Work Orders with lines
    // Get seeded products to reference them
    const dbProducts = await prisma.producto.findMany();
    const p1 = dbProducts.find(p => p.nombre.includes("Neumático"));
    const p2 = dbProducts.find(p => p.nombre.includes("Cámara"));

    // Order 1: Active (En curso)
    const o1 = await prisma.ordenDeTrabajo.create({
      data: {
        idUsuario: user.idUsuario,
        idCliente: c1.idCliente,
        fechaRecepcion: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        fechaEntregaEstimada: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // in 3 days
        observacionesIngreso: "Mantencion general de transmision",
        total: 55000, // Total = 20000 (service) + 35000 (product)
        descuento: 0,
        estadoPago: "pendiente",
        estadoOrden: "En curso",
        bicicletas: {
          create: [
            {
              marca: "Trek",
              modelo: "Marlin 7",
              color: "Negro/Rojo",
              descripcion: "Tiene ruidos en la caja de motor y frenos desregulados"
            }
          ]
        },
        lineasDeOrdenDeTrabajo: {
          create: [
            // Service line
            {
              idServicio: sTaller.idServicio,
              cantidad: 1,
              precioUnitario: 20000 // Labor cost
            },
            // Product line
            ...(p1 ? [{
              idProducto: p1.idProducto,
              cantidad: 1,
              precioUnitario: p1.precioVenta
            }] : [])
          ]
        }
      }
    });
    console.log("Created Order 1 (En curso)");

    // Order 2: En espera (Waiting for parts)
    const o2 = await prisma.ordenDeTrabajo.create({
      data: {
        idUsuario: user.idUsuario,
        idCliente: c2.idCliente,
        fechaRecepcion: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        fechaEntregaEstimada: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        observacionesIngreso: "Cambio de horquilla delantera",
        total: 120000,
        descuento: 10,
        estadoPago: "pendiente",
        estadoOrden: "En espera",
        bicicletas: {
          create: [
            {
              marca: "Specialized",
              modelo: "Chisel",
              color: "Verde Militar",
              descripcion: "Horquilla rota, esperando repuesto RockShox Judy"
            }
          ]
        },
        lineasDeOrdenDeTrabajo: {
          create: [
            {
              idServicio: sTaller.idServicio,
              cantidad: 1,
              precioUnitario: 120000
            }
          ]
        }
      }
    });
    console.log("Created Order 2 (En espera)");

    // Order 3: Completed Today (Listo para entregar)
    const o3 = await prisma.ordenDeTrabajo.create({
      data: {
        idUsuario: user.idUsuario,
        idCliente: c1.idCliente,
        fechaRecepcion: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        fechaEntregaEstimada: new Date(),
        fechaEntregaReal: new Date(),
        observacionesIngreso: "Regulacion de cambios y lavado",
        total: 21000, // Total = 15000 (service) + 6000 (product)
        descuento: 0,
        estadoPago: "pagado",
        estadoOrden: "Listo para entregar",
        bicicletas: {
          create: [
            {
              marca: "Giant",
              modelo: "Talon 2",
              color: "Azul",
              descripcion: "Cadena sucia, cambios desregulados"
            }
          ]
        },
        lineasDeOrdenDeTrabajo: {
          create: [
            {
              idServicio: sTaller.idServicio,
              cantidad: 1,
              precioUnitario: 15000
            },
            ...(p2 ? [{
              idProducto: p2.idProducto,
              cantidad: 1,
              precioUnitario: p2.precioVenta
            }] : [])
          ]
        }
      }
    });
    console.log("Created Order 3 (Listo para entregar)");

    // Order 4: Delayed (Retrasada)
    const o4 = await prisma.ordenDeTrabajo.create({
      data: {
        idUsuario: user.idUsuario,
        idCliente: c3.idCliente,
        fechaRecepcion: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        fechaEntregaEstimada: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        observacionesIngreso: "Centrado de llantas y cambio de rayos",
        total: 25000,
        descuento: 0,
        estadoPago: "pendiente",
        estadoOrden: "En curso",
        bicicletas: {
          create: [
            {
              marca: "Scott",
              modelo: "Aspect 940",
              color: "Naranja",
              descripcion: "Llanta trasera muy descentrada con 3 rayos cortados"
            }
          ]
        },
        lineasDeOrdenDeTrabajo: {
          create: [
            {
              idServicio: sTaller.idServicio,
              cantidad: 1,
              precioUnitario: 25000
            }
          ]
        }
      }
    });
    console.log("Created Order 4 (Retrasada)");

    // Order 5: Due in next 24-48 hours
    const o5 = await prisma.ordenDeTrabajo.create({
      data: {
        idUsuario: user.idUsuario,
        idCliente: c2.idCliente,
        fechaRecepcion: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        fechaEntregaEstimada: new Date(now.getTime() + 30 * 60 * 60 * 1000),
        observacionesIngreso: "Purgado de frenos hidraulicos Shimano MT200",
        total: 18000,
        descuento: 0,
        estadoPago: "pendiente",
        estadoOrden: "Por realizar",
        bicicletas: {
          create: [
            {
              marca: "Cannondale",
              modelo: "Trail 5",
              color: "Gris/Amarillo",
              descripcion: "Manilla de freno trasero se va a fondo sin tacto"
            }
          ]
        },
        lineasDeOrdenDeTrabajo: {
          create: [
            {
              idServicio: sTaller.idServicio,
              cantidad: 1,
              precioUnitario: 18000
            }
          ]
        }
      }
    });
    console.log("Created Order 5 (Vence pronto)");

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Error seeding:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
