// tests/integration/punto-venta.test.ts
import { describe, it, expect, beforeEach, vi, afterAll } from "vitest";
import { POST } from "@/app/api/punto-venta/route";
import { db } from "@/lib/db";
import * as requirePermissionModule from "@/lib/require-permission";

// 1. Mockeamos los permisos para que la API nos deje pasar
vi.spyOn(requirePermissionModule, "requirePermission").mockResolvedValue({
  session: { user: { idUsuario: 1, permisos: ["sales:create", "work-orders:create"] } } as any,
  response: null,
});

describe("Integración: Punto de Venta y Transacciones (UC-94)", () => {
  
  // 2. Antes de cada test, limpiamos las tablas para tener un estado predecible
  beforeEach(async () => {
    // Borrar en orden para respetar las llaves foráneas (FK)
    await db.lineaDeVenta.deleteMany();
    await db.ventaEnMostrador.deleteMany();
    await db.venta.deleteMany();
    await db.producto.deleteMany();
    await db.cliente.deleteMany();
    await db.usuario.deleteMany();
    await db.rol.deleteMany();
  });

  // Limpiar conexiones al terminar todos los tests
  afterAll(async () => {
    await db.$disconnect();
  });

  it("Camino Feliz: Debe crear una venta, descontar stock y guardar las líneas correctamente", async () => {
    // PREPARACIÓN DE DATOS SEMILLA
    const rol = await db.rol.create({ data: { nombre: "Admin", estado: "activo" }});
    const usuario = await db.usuario.create({
      data: { idRol: rol.idRol, primerNombre: "Juan", apellidoPaterno: "Perez", rut: "11-1", contrasenaHash: "x", estado: "activo" }
    });
    const cliente = await db.cliente.create({
      data: { tipoCliente: "natural", rut: "22-2", estado: "activo", correo: "cliente@test.com" }
    });
    const producto = await db.producto.create({
      data: { 
        nombre: "Casco Specialized", tipoProducto: "accesorio", estado: "activo", 
        precioVenta: 50000, costoPromedio: 20000, stockActual: 10, stockMinimo: 2, urlImagen: "" 
      }
    });

    // EJECUCIÓN (Llamar al endpoint)
    const payload = {
      id_usuario: usuario.idUsuario,
      id_cliente: cliente.idCliente,
      descuento: 5000, // Aplicamos un descuento global
      estado_pago: "pagado",
      productos: [{ id_producto: producto.idProducto, cantidad: 2 }] // Compramos 2 cascos
    };

    const req = new Request("http://localhost/api/punto-venta", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    // VERIFICACIÓN HTTP
    expect(res.status).toBe(201);
    expect(json.code).toBe("PUNTO_VENTA_CONFIRMADO");
    
    // VERIFICACIÓN MATEMÁTICA (2 * 50k = 100k. Menos 5k descuento = 95k)
    expect(json.total).toBe(95000);

    // VERIFICACIÓN DE BASE DE DATOS (Efectos colaterales)
    // 1. El stock debe haber bajado de 10 a 8
    const prodVerificacion = await db.producto.findUnique({ where: { idProducto: producto.idProducto }});
    expect(prodVerificacion?.stockActual).toBe(8);

    // 2. La venta se debe haber creado
    const ventasDb = await db.venta.findMany({ include: { ventaEnMostrador: true } });
    expect(ventasDb.length).toBe(1);
    expect(Number(ventasDb[0].ventaEnMostrador?.montoTotal)).toBe(95000);
  });

  it("Rollback Forzado: NO debe crear venta ni descontar stock si no hay stock suficiente", async () => {
    // PREPARACIÓN DE DATOS SEMILLA
    const rol = await db.rol.create({ data: { nombre: "Admin", estado: "activo" }});
    const usuario = await db.usuario.create({
      data: { idRol: rol.idRol, primerNombre: "Ana", apellidoPaterno: "Gomez", rut: "33-3", contrasenaHash: "x", estado: "activo" }
    });
    const cliente = await db.cliente.create({
      data: { tipoCliente: "natural", rut: "44-4", estado: "activo", correo: "cliente2@test.com" }
    });
    
    // ATENCIÓN: Solo hay 1 en stock
    const producto = await db.producto.create({
      data: { 
        nombre: "Luz LED", tipoProducto: "accesorio", estado: "activo", 
        precioVenta: 10000, costoPromedio: 5000, stockActual: 1, stockMinimo: 0, urlImagen: "" 
      }
    });

    // EJECUCIÓN: Intentamos comprar 5
    const payload = {
      id_usuario: usuario.idUsuario,
      id_cliente: cliente.idCliente,
      productos: [{ id_producto: producto.idProducto, cantidad: 5 }] 
    };

    const req = new Request("http://localhost/api/punto-venta", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    // VERIFICACIÓN HTTP
    expect(res.status).toBe(409);
    expect(json.code).toBe("STOCK_INSUFICIENTE");

    // VERIFICACIÓN DE ROLLBACK EN BASE DE DATOS
    // 1. El stock debe seguir siendo 1 (no se debió descontar nada)
    const prodVerificacion = await db.producto.findUnique({ where: { idProducto: producto.idProducto }});
    expect(prodVerificacion?.stockActual).toBe(1);

    // 2. La venta NO se debió registrar
    const ventasDb = await db.venta.count();
    expect(ventasDb).toBe(0);
  });

});