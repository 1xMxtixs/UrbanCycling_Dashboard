import assert from "node:assert/strict"
import { test } from "node:test"
import type { Prisma } from "@/generated/prisma"
import {
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
  parseCategoryId,
  parseCategoryInput,
  validarCategoriasAsignables,
} from "./inventory-categories"
import { inventoryCategoryErrorResponse } from "@/app/api/_lib/inventory-category-response"

type Category = {
  idCategoria: number
  nombre: string
  descripcion: string | null
  estado: "ACTIVO" | "INACTIVO"
}
function scenario() {
  const categories: Category[] = [
    { idCategoria: 1, nombre: "Ruedas", descripcion: null, estado: "ACTIVO" },
    {
      idCategoria: 2,
      nombre: "Accesorios",
      descripcion: "Equipamiento",
      estado: "INACTIVO",
    },
  ]
  const assignments = [
    { idProducto: 10, idCategoria: 1 },
    { idProducto: 10, idCategoria: 2 },
  ]
  let locked = false
  const tx = {
    $queryRaw: async () => {
      locked = true
      return []
    },
    categoria: {
      findUnique: async ({
        where,
      }: {
        where: { idCategoria?: number; nombre?: string }
      }) =>
        structuredClone(
          categories.find((category) =>
            where.idCategoria !== undefined
              ? category.idCategoria === where.idCategoria
              : category.nombre.toLowerCase() === where.nombre?.toLowerCase()
          ) ?? null
        ),
      findMany: async ({
        where,
      }: {
        where: { idCategoria: { in: number[] } }
      }) => {
        assert.ok(
          locked,
          "debe bloquear categorías antes de validar asignaciones"
        )
        return structuredClone(
          categories.filter((category) =>
            where.idCategoria.in.includes(category.idCategoria)
          )
        )
      },
      create: async ({ data }: { data: Omit<Category, "idCategoria"> }) => {
        const category = { ...data, idCategoria: 3 }
        categories.push(category)
        return category
      },
      update: async ({
        where,
        data,
      }: {
        where: { idCategoria: number }
        data: Partial<Category>
      }) => {
        assert.ok(locked)
        const index = categories.findIndex(
          (category) => category.idCategoria === where.idCategoria
        )
        categories[index] = { ...categories[index], ...data }
        return categories[index]
      },
      delete: async ({ where }: { where: { idCategoria: number } }) => {
        assert.ok(locked)
        categories.splice(
          categories.findIndex(
            (category) => category.idCategoria === where.idCategoria
          ),
          1
        )
      },
    },
    categoriaProducto: {
      findMany: async ({ where }: { where: { idProducto: number } }) =>
        assignments.filter((item) => item.idProducto === where.idProducto),
      count: async ({ where }: { where: { idCategoria: number } }) => {
        assert.ok(locked, "debe bloquear antes de comprobar asociaciones")
        return assignments.filter(
          (item) => item.idCategoria === where.idCategoria
        ).length
      },
    },
  }
  return {
    tx: tx as unknown as Prisma.TransactionClient,
    categories,
    assignments,
  }
}

test("crear normaliza espacios y aplica estado activo por defecto", async () => {
  const s = scenario()
  const category = await crearCategoria(s.tx, {
    nombre: "  Repuestos   varios  ",
    descripcion: "  Otros  ",
  })
  assert.equal(category.nombre, "Repuestos varios")
  assert.equal(category.descripcion, "Otros")
  assert.equal(category.estado, "ACTIVO")
})

test("rechaza nombres vacíos, límites de longitud, estados y cuerpos inválidos", () => {
  for (const body of [
    null,
    [],
    "Ruedas",
    {},
    { nombre: "   " },
    { nombre: 10 },
    { nombre: "x".repeat(51) },
    { nombre: "Ruedas", descripcion: "x".repeat(256) },
    { nombre: "Ruedas", descripcion: false },
    { nombre: "Ruedas", estado: "OTRO" },
  ]) {
    assert.throws(() => parseCategoryInput(body))
  }
  assert.throws(() => parseCategoryInput({}, true), {
    code: "CAMPOS_REQUERIDOS",
  })
  assert.deepEqual(parseCategoryInput({ descripcion: "  " }, true), {
    descripcion: null,
  })
  assert.equal(
    parseCategoryInput({ nombre: "x".repeat(50), descripcion: "x".repeat(255) })
      .nombre?.length,
    50
  )
})

test("rechaza identificadores inválidos", () => {
  for (const value of ["0", "-1", "abc", "1.5", "Infinity", "9007199254740992"])
    assert.throws(() => parseCategoryId(value))
  assert.equal(parseCategoryId("12"), 12)
})

test("crear y renombrar rechazan nombres duplicados", async () => {
  const s = scenario()
  await assert.rejects(crearCategoria(s.tx, { nombre: "ruedas" }), {
    code: "CATEGORIA_DUPLICADA",
  })
  await assert.rejects(editarCategoria(s.tx, 2, { nombre: "Ruedas" }), {
    code: "CATEGORIA_DUPLICADA",
  })
  const same = await editarCategoria(s.tx, 1, { nombre: "Ruedas" })
  assert.equal(same.idCategoria, 1)
})

test("renombrar, desactivar y reactivar preservan las asociaciones", async () => {
  const s = scenario()
  const before = structuredClone(s.assignments)
  await editarCategoria(s.tx, 1, {
    nombre: "Neumáticos",
    descripcion: "Ruedas y cámaras",
    estado: "INACTIVO",
  })
  assert.equal(s.categories[0].nombre, "Neumáticos")
  assert.equal(s.categories[0].estado, "INACTIVO")
  await editarCategoria(s.tx, 1, { estado: "ACTIVO" })
  assert.equal(s.categories[0].estado, "ACTIVO")
  assert.deepEqual(s.assignments, before)
})

test("solo elimina categorías sin productos y bloquea las asociadas aunque estén inactivas", async () => {
  const s = scenario()
  await assert.rejects(eliminarCategoria(s.tx, 1), {
    code: "CATEGORIA_CON_PRODUCTOS",
  })
  await assert.rejects(eliminarCategoria(s.tx, 2), {
    code: "CATEGORIA_CON_PRODUCTOS",
  })
  await crearCategoria(s.tx, { nombre: "Herramientas" })
  await eliminarCategoria(s.tx, 3)
  assert.equal(s.categories.length, 2)
  assert.equal(s.assignments.length, 2)
})

test("edición y eliminación de categorías inexistentes devuelven 404", async () => {
  const s = scenario()
  await assert.rejects(editarCategoria(s.tx, 999, { estado: "INACTIVO" }), {
    code: "CATEGORIA_NO_EXISTE",
    status: 404,
  })
  await assert.rejects(eliminarCategoria(s.tx, 999), {
    code: "CATEGORIA_NO_EXISTE",
    status: 404,
  })
})

test("asigna categorías activas y conserva inactivas que el producto ya tenía", async () => {
  const s = scenario()
  await validarCategoriasAsignables(s.tx, [1])
  await validarCategoriasAsignables(s.tx, [1, 2], 10)
  await validarCategoriasAsignables(s.tx, [1], 10)
  await validarCategoriasAsignables(s.tx, [], 10)
  await assert.rejects(validarCategoriasAsignables(s.tx, [2]), {
    code: "CATEGORIAS_INVALIDAS",
  })
  await assert.rejects(validarCategoriasAsignables(s.tx, [2], 20), {
    code: "CATEGORIAS_INVALIDAS",
  })
  await assert.rejects(validarCategoriasAsignables(s.tx, [999], 10), {
    code: "CATEGORIAS_INVALIDAS",
  })
})

test("convierte conflictos de unicidad o referencias de la BD en errores controlados", async () => {
  const duplicate = inventoryCategoryErrorResponse({ code: "P2002" })
  assert.equal(duplicate?.status, 409)
  assert.equal((await duplicate?.json()).code, "CATEGORIA_DUPLICADA")
  const linked = inventoryCategoryErrorResponse({ code: "P2003" })
  assert.equal(linked?.status, 409)
  assert.equal((await linked?.json()).code, "CATEGORIA_CON_PRODUCTOS")
  assert.equal(
    inventoryCategoryErrorResponse(new Error("fallo inesperado")),
    null
  )
})
