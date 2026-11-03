// node --test tests/purchase-order-receptions.test.mjs
// Controladores reales con sesión y persistencia simuladas; no modifica la BD.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import ts from "typescript"
import { createRequire } from "node:module"
const dependencyRequire = createRequire(import.meta.url)

function harness() {
  const state = {
    authenticated: true,
    permissions: ["purchase_orders:update", "inventory:update"],
    order: {
      idOrdenDeCompra: 1,
      estado: "ENVIADA",
      estadoPago: "PENDIENTE",
      estadoRecepcion: "PENDIENTE",
      fechaEntregaReal: null,
      lineas: [
        {
          idLineaDeOrdenDeCompra: 11,
          idProducto: 101,
          cantidadOrdenada: 10,
          cantidadRecibida: 0,
          precioCostoUnitario: 100,
        },
        {
          idLineaDeOrdenDeCompra: 12,
          idProducto: 102,
          cantidadOrdenada: 5,
          cantidadRecibida: 0,
          precioCostoUnitario: 200,
        },
      ],
      asignacionesPago: [],
    },
    stock: { 101: 20, 102: 30 },
    movements: [],
    audits: [],
    locks: [],
    failAudit: false,
  }
  const db = {
    ordenDeCompra: {
      findUnique: async ({ where }) =>
        state.order?.idOrdenDeCompra === where.idOrdenDeCompra
          ? structuredClone(state.order)
          : null,
      update: async ({ data }) => {
        Object.assign(state.order, data)
        return structuredClone(state.order)
      },
    },
    lineaDeOrdenDeCompra: {
      update: async ({ where, data }) => {
        const line = state.order.lineas.find(
          (line) => line.idLineaDeOrdenDeCompra === where.idLineaDeOrdenDeCompra
        )
        line.cantidadRecibida += data.cantidadRecibida.increment
        return { ...line }
      },
    },
    producto: {
      updateMany: async ({ where, data }) => {
        const stock = state.stock[where.idProducto]
        if (stock === undefined || stock > where.stockActual.lte)
          return { count: 0 }
        state.stock[where.idProducto] += data.stockActual.increment
        return { count: 1 }
      },
    },
    movimientoInventario: {
      create: async ({ data }) => {
        const movement = {
          ...data,
          idMovimientoInventario: state.movements.length + 1,
        }
        state.movements.push(movement)
        return movement
      },
    },
    auditoria: {
      create: async ({ data }) => {
        if (state.failAudit) throw new Error("Fallo de auditoría simulado")
        state.audits.push(data)
        return data
      },
    },
  }
  let queue = Promise.resolve()
  db.$transaction = async (fn) => {
    const previous = queue
    let release
    queue = new Promise((resolve) => {
      release = resolve
    })
    await previous
    const before = structuredClone({
      order: state.order,
      stock: state.stock,
      movements: state.movements,
      audits: state.audits,
    })
    try {
      return await fn({
        ...db,
        $queryRaw: async (strings) => {
          state.locks.push(strings.join("?"))
          return []
        },
      })
    } catch (error) {
      Object.assign(state, before)
      throw error
    } finally {
      release()
    }
  }
  const cache = new Map()
  function load(file) {
    const filename = path.resolve(file)
    if (cache.has(filename)) return cache.get(filename).exports
    const loaded = { exports: {} }
    cache.set(filename, loaded)
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText
    const localRequire = (id) => {
      if (id === "@/lib/db") return { db }
      if (id === "@/lib/require-permission")
        return {
          requirePermission: async (permission) => {
            if (!state.authenticated)
              return {
                session: null,
                response: new Response("Sin sesión", { status: 401 }),
              }
            if (!state.permissions.includes(permission))
              return {
                session: null,
                response: new Response("Sin permisos", { status: 403 }),
              }
            return {
              session: { user: { idUsuario: 7, permisos: state.permissions } },
              response: null,
            }
          },
        }
      if (id === "@/generated/prisma")
        return dependencyRequire(path.resolve("generated/prisma"))
      if (id.startsWith("@/")) return load(id.slice(2) + ".ts")
      return dependencyRequire(id)
    }
    vm.runInThisContext(
      "(function(require,module,exports,console){" + compiled + "\n})",
      { filename }
    )(localRequire, loaded, loaded.exports, { error: () => {} })
    return loaded.exports
  }
  const route = load("app/api/ordenes-compra/[id]/recepciones/route.ts")
  const transition = load("app/api/ordenes-compra/[id]/estado/route.ts")
  return {
    state,
    receive: (lineas, id = "1") =>
      route.POST(
        new Request("http://localhost/api", {
          method: "POST",
          body: JSON.stringify({ lineas }),
        }),
        { params: Promise.resolve({ id }) }
      ),
    raw: (body) =>
      route.POST(
        new Request("http://localhost/api", { method: "POST", body }),
        { params: Promise.resolve({ id: "1" }) }
      ),
    transition: (accion) =>
      transition.PATCH(
        new Request("http://localhost/api", {
          method: "PATCH",
          body: JSON.stringify({ accion }),
        }),
        { params: Promise.resolve({ id: "1" }) }
      ),
  }
}
const input = (id, quantity, previous = 0) => ({
  idLineaDeOrdenDeCompra: id,
  cantidadRecibida: quantity,
  cantidadRecibidaAnterior: previous,
})

test("recibe entregas parciales sin pago y solo suma las cantidades físicas", async () => {
  const { state, receive } = harness()
  assert.equal((await receive([input(11, 6)])).status, 201)
  assert.deepEqual(state.stock, { 101: 26, 102: 30 })
  assert.equal(state.order.lineas[0].cantidadOrdenada, 10)
  assert.equal(state.order.lineas[0].cantidadRecibida, 6)
  assert.equal(state.order.estadoRecepcion, "PARCIAL")
  assert.equal(state.order.estadoPago, "PENDIENTE")
  assert.equal(state.order.fechaEntregaReal, null)
  assert.equal(state.movements[0].cantidad, 6)
  assert.equal(state.audits[0].idUsuario, 7)
  assert.match(state.locks[0], /ordenes_de_compra.*FOR UPDATE/)
  assert.match(state.locks[1], /lineas_de_orden_de_compra.*FOR UPDATE/)
  assert.equal((await receive([input(11, 4, 6), input(12, 5)])).status, 201)
  assert.deepEqual(state.stock, { 101: 30, 102: 35 })
  assert.equal(state.order.estadoRecepcion, "RECIBIDA")
  assert.equal(state.order.estado, "ENVIADA")
  assert.ok(state.order.fechaEntregaReal instanceof Date)
  assert.deepEqual(
    state.movements.map((m) => m.cantidad),
    [6, 4, 5]
  )
})

test("no permite cerrar sin pago ni recepción completa; el cierre no vuelve a sumar stock", async () => {
  const { state, receive, transition } = harness()
  assert.equal((await transition("COMPLETAR")).status, 409)
  state.order.estadoPago = "PAGADA"
  assert.equal((await transition("COMPLETAR")).status, 409)
  await receive([input(11, 10), input(12, 5)])
  const stock = { ...state.stock }
  const movements = state.movements.length
  const date = state.order.fechaEntregaReal
  assert.equal((await transition("COMPLETAR")).status, 200)
  assert.equal(state.order.estado, "COMPLETADA")
  assert.deepEqual(state.stock, stock)
  assert.equal(state.movements.length, movements)
  assert.deepEqual(state.order.fechaEntregaReal, date)
  assert.equal((await transition("COMPLETAR")).status, 409)
})

test("rechaza cantidades negativas, fracciones, vacías, repetidas y superiores a lo pendiente", async () => {
  const { state, receive, raw } = harness()
  for (const lines of [
    [],
    [input(11, 0)],
    [input(11, -1)],
    [input(11, 1.5)],
    [input(11, "2")],
    [input(11, 4294967296)],
    [input(11, 2), input(11, 2)],
    [{ idLineaDeOrdenDeCompra: 11, cantidadRecibida: 2 }],
  ]) {
    assert.equal((await receive(lines)).status, 400)
  }
  assert.equal((await raw("{")).status, 400)
  assert.equal((await receive([input(11, 11)])).status, 409)
  assert.equal((await receive([input(99, 1)])).status, 400)
  assert.equal((await receive([input(11, 1)], "x")).status, 400)
  assert.equal((await receive([input(11, 1)], "99")).status, 404)
  assert.deepEqual(state.stock, { 101: 20, 102: 30 })
  assert.equal(state.movements.length, 0)
})

test("valida todo el lote antes de actualizar líneas y stock", async () => {
  const { state, receive } = harness()
  assert.equal((await receive([input(11, 3), input(12, 6)])).status, 409)
  assert.equal(state.order.lineas[0].cantidadRecibida, 0)
  assert.equal(state.stock[101], 20)
  assert.equal(state.movements.length, 0)
})

test("un reintento desactualizado no duplica stock incluso si todavía queda saldo", async () => {
  const { state, receive } = harness()
  state.order.lineas[0].cantidadOrdenada = 20
  assert.equal((await receive([input(11, 6)])).status, 201)
  const retry = await receive([input(11, 6)])
  assert.equal(retry.status, 409)
  assert.equal((await retry.json()).code, "RECEPCION_DESACTUALIZADA")
  assert.equal(state.stock[101], 26)
  assert.equal(state.movements.length, 1)
})

test("dos recepciones simultáneas de la misma línea no duplican el ingreso", async () => {
  const { state, receive } = harness()
  const results = await Promise.all([
    receive([input(11, 6)]),
    receive([input(11, 6)]),
  ])
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409])
  assert.equal(state.stock[101], 26)
  assert.equal(state.order.lineas[0].cantidadRecibida, 6)
})

test("recepciones simultáneas de líneas distintas conservan ambas entregas", async () => {
  const { state, receive } = harness()
  const results = await Promise.all([
    receive([input(11, 10)]),
    receive([input(12, 5)]),
  ])
  assert.deepEqual(
    results.map((r) => r.status),
    [201, 201]
  )
  assert.equal(state.order.estadoRecepcion, "RECIBIDA")
  assert.deepEqual(state.stock, { 101: 30, 102: 35 })
})

test("si falla la auditoría se revierten stock, cantidades y movimientos", async () => {
  const { state, receive } = harness()
  state.failAudit = true
  assert.equal((await receive([input(11, 3)])).status, 500)
  assert.equal(state.stock[101], 20)
  assert.equal(state.order.lineas[0].cantidadRecibida, 0)
  assert.equal(state.order.estadoRecepcion, "PENDIENTE")
  assert.equal(state.movements.length, 0)
  assert.equal(state.audits.length, 0)
})

test("solo recibe órdenes enviadas y protege el límite de stock", async () => {
  const { state, receive } = harness()
  for (const status of ["BORRADOR", "ANULADA", "COMPLETADA"]) {
    state.order.estado = status
    assert.equal((await receive([input(11, 1)])).status, 409)
  }
  state.order.estado = "ENVIADA"
  state.stock[101] = 4294967295
  assert.equal((await receive([input(11, 1)])).status, 409)
  assert.equal(state.order.lineas[0].cantidadRecibida, 0)
})

test("exige sesión y permisos de compras e inventario", async () => {
  const { state, receive } = harness()
  state.authenticated = false
  assert.equal((await receive([input(11, 1)])).status, 401)
  state.authenticated = true
  for (const permissions of [
    ["inventory:update"],
    ["purchase_orders:update"],
  ]) {
    state.permissions = permissions
    assert.equal((await receive([input(11, 1)])).status, 403)
  }
  assert.equal(state.movements.length, 0)
})

test("anular sigue bloqueado si ya se recibió mercadería", async () => {
  const { receive, transition } = harness()
  await receive([input(11, 1)])
  assert.equal((await transition("ANULAR")).status, 409)
})
