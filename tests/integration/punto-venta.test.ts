// tests/integration/punto-venta.test.ts
import { describe, it, expect, beforeEach, vi, afterAll } from "vitest";
import { POST } from "@/app/api/punto-venta/route";
import { db } from "@/lib/db";
import * as requirePermissionModule from "@/lib/require-permission";

let currentUserId: number;

vi.spyOn(requirePermissionModule, "requirePermission").mockImplementation(
  async () => ({
    session: {
      user: {
        idUsuario: currentUserId,
        permisos: ["sales:create", "work-orders:create"],
      },
    } as any,
    response: null,
  })
);

describe("Integración: Punto de Venta y Transacciones (UC-94)", () => {
  beforeEach(async () => {
    await db.lineaDeVenta.deleteMany();
    await db.ventaEnMostrador.deleteMany();
    await db.venta.deleteMany();
    await db.producto.deleteMany();
    await db.cliente.deleteMany();
    await db.usuario.deleteMany();
    await db.rol.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("Camino Feliz: Debe crear una venta, descontar stock y guardar las líneas correctamente", async () => {
    const rol = await db.rol.create({
      data: {
        nombre: "Admin",
        estado: "activo",
      },
    });

    const usuario = await db.usuario.create({
      data: {
        idRol: rol.idRol,
        primerNombre: "Juan",
        apellidoPaterno: "Perez",
        rut: "11-1",
        contrasenaHash: "x",
        estado: "activo",
      },
    });

    currentUserId = usuario.idUsuario;

    console.log("USUARIO TEST 1:", usuario.idUsuario);

    const usuarioVerificacion = await db.usuario.findUnique({
      where: {
        idUsuario: usuario.idUsuario,
      },
    });

    console.log("USUARIO EN DB TEST 1:", usuarioVerificacion);

    const cliente = await db.cliente.create({
      data: {
        tipoCliente: "natural",
        rut: "22-2",
        estado: "activo",
        correo: "cliente@test.com",
      },
    });

    const producto = await db.producto.create({
      data: {
        nombre: "Casco Specialized",
        tipoProducto: "accesorio",
        estado: "activo",
        precioVenta: 50000,
        costoPromedio: 20000,
        stockActual: 10,
        stockMinimo: 2,
        urlImagen: "",
      },
    });

    const payload = {
      id_usuario: usuario.idUsuario,
      id_cliente: cliente.idCliente,
      descuento: 5000,
      estado_pago: "pagado",
      productos: [
        {
          id_producto: producto.idProducto,
          cantidad: 2,
        },
      ],
    };

    const req = new Request("http://localhost/api/punto-venta", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    console.log("RESPUESTA CAMINO FELIZ:", res.status, json);

    expect(res.status).toBe(201);
    expect(json.code).toBe("PUNTO_VENTA_CONFIRMADO");

    expect(json.total).toBe(95000);

    const prodVerificacion = await db.producto.findUnique({
      where: {
        idProducto: producto.idProducto,
      },
    });

    expect(prodVerificacion?.stockActual).toBe(8);

    const ventasDb = await db.venta.findMany({
      include: {
        ventaEnMostrador: true,
      },
    });

    expect(ventasDb.length).toBe(1);
    expect(Number(ventasDb[0].ventaEnMostrador?.montoTotal)).toBe(95000);
  });

  it("Rollback Forzado: NO debe crear venta ni descontar stock si no hay stock suficiente", async () => {
    const rol = await db.rol.create({
      data: {
        nombre: "Admin",
        estado: "activo",
      },
    });

    const usuario = await db.usuario.create({
      data: {
        idRol: rol.idRol,
        primerNombre: "Ana",
        apellidoPaterno: "Gomez",
        rut: "33-3",
        contrasenaHash: "x",
        estado: "activo",
      },
    });

    currentUserId = usuario.idUsuario;

    console.log("USUARIO TEST 2:", usuario.idUsuario);

    const usuarioVerificacion = await db.usuario.findUnique({
      where: {
        idUsuario: usuario.idUsuario,
      },
    });

    console.log("USUARIO EN DB TEST 2:", usuarioVerificacion);

    const cliente = await db.cliente.create({
      data: {
        tipoCliente: "natural",
        rut: "44-4",
        estado: "activo",
        correo: "cliente2@test.com",
      },
    });

    const producto = await db.producto.create({
      data: {
        nombre: "Luz LED",
        tipoProducto: "accesorio",
        estado: "activo",
        precioVenta: 10000,
        costoPromedio: 5000,
        stockActual: 1,
        stockMinimo: 0,
        urlImagen: "",
      },
    });

    const payload = {
      id_usuario: usuario.idUsuario,
      id_cliente: cliente.idCliente,
      productos: [
        {
          id_producto: producto.idProducto,
          cantidad: 5,
        },
      ],
    };

    const req = new Request("http://localhost/api/punto-venta", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    console.log("RESPUESTA ROLLBACK:", res.status, json);

    expect(res.status).toBe(409);
    expect(json.code).toBe("STOCK_INSUFICIENTE");

    const prodVerificacion = await db.producto.findUnique({
      where: {
        idProducto: producto.idProducto,
      },
    });

    expect(prodVerificacion?.stockActual).toBe(1);

    const ventasDb = await db.venta.count();

    expect(ventasDb).toBe(0);
  });
});