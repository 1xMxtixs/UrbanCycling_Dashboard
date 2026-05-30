import { inventoryRepository } from "@/lib/inventory/repository";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      tipo,
      nombre,
      descripcion,
      estado,
      precio_venta,
      stock_minimo,
      stock_actual,
      categorias,
    } = data;

    if (!tipo || !nombre || precio_venta === undefined || stock_minimo === undefined || stock_actual === undefined) {
      return NextResponse.json(
        { code: "FALTAN_DATOS", message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const productoExistente = await inventoryRepository.findByName(nombre);

    if (productoExistente) {
      return NextResponse.json(
        { code: "PRODUCTO_DUPLICADO", message: "Ya existe un producto con ese nombre" },
        { status: 409 }
      );
    }

    const producto = await inventoryRepository.create({
      tipo,
      nombre,
      descripcion: descripcion ?? "",
      estado: estado ?? "activo",
      precio_venta: Number(precio_venta),
      stock_minimo: Number(stock_minimo),
      stock_actual: Number(stock_actual),
      categorias: categorias ?? [],
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.log("[PRODUCTOS_POST]", error);
    return NextResponse.json({ code: "ERROR_INTERNO" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const productos = await inventoryRepository.findMany(
    {
      search: searchParams.get("search") ?? undefined,
      tipo: searchParams.get("tipo") ?? undefined,
      estado: searchParams.get("estado") ?? undefined,
      categoriaId: searchParams.get("categoriaId")
        ? Number(searchParams.get("categoriaId"))
        : undefined,
      lowStock: searchParams.get("lowStock") === "true",
    },
    {
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 10),
    }
  );

  return NextResponse.json(productos);
}