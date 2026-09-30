# Auditoría de mensajes de confirmación en acciones críticas (CU92)

| | |
|---|---|
| **Tarea Jira** | UC-155 / [T3-55] |
| **Fecha** | 29-09-2026 |
| **Rama auditada** | `main` en el commit `f43fdef` |
| **Resultado** | 15 acciones críticas revisadas: 3 con confirmación efectiva, 6 faltantes, 5 aceptables por formulario. Un cuarto diálogo existe pero es inalcanzable |
| **Verificación** | Las acciones críticas de órdenes de trabajo y ventas se ejecutaron en el sistema con evidencia en `docs/evidencias/cu47/` |

---

## 1. Criterio de aceptación usado

Se considera **acción crítica** aquella que es irreversible desde la interfaz, o que afecta dinero, stock, documentos tributarios o permisos de acceso.

Una acción crítica está **cubierta** cuando, antes de ejecutarse, muestra un diálogo modal que:

1. Nombra el objeto afectado (número de orden, número de venta, nombre del usuario).
2. Advierte la consecuencia con un verbo explícito.
3. Exige un segundo clic en un botón distinto al que abrió el diálogo.

No se aceptan como confirmación: el mensaje `toast` posterior a la acción, el deshabilitado del botón, ni el envío de un formulario de creación.

---

## 2. Resumen por módulo

| Módulo | Acciones críticas | Cubiertas | Faltantes |
|---|---|---|---|
| Órdenes de trabajo | 6 | 1 | 2 |
| Ventas | 4 | 0 | 3 |
| Usuarios | 2 | 1 | 1 |
| Inventario | 2 | 0 | 0 |
| Perfil | 1 | 1 | 0 |

---

## 3. Detalle de la revisión

### 3.1 Acciones cubiertas

| Acción | Archivo | Mecanismo |
|---|---|---|
| Anular orden de trabajo (Edición Integral) | `ListOrdenesTrabajo/AssignSuppliesDialog.tsx:1095` | Diálogo propio con botón "Confirmar Anulación". Verificado en ejecución |
| Quitar rol a un usuario | `usuarios/components/ListUsuarios/ListUsuarios.tsx` | `AlertDialog` de shadcn |
| Cambiar correo, teléfono o clave propios | `perfil/profile-content.tsx:537` | Exige la clave actual antes de guardar |

Existe un cuarto diálogo, `ListOrdenesTrabajo/CancelOrderDialog.tsx`, que está montado pero **ningún elemento de la interfaz lo abre**: `onCancelClick` se pasa a la tabla y al detalle, y nunca se invoca. Es código muerto, detallado en `cu47-anulando-orden-de-trabajo.md` como BUG-CU47-02.

### 3.2 Faltantes detectados

| ID | Acción | Archivo y línea | Severidad |
|---|---|---|---|
| CONF-01 | Anular venta desde el menú de la fila | `ventas/components/ListVentas/columns.tsx:82` | Alta |
| CONF-02 | Anular venta desde el detalle de la venta | `ventas/components/ListVentas/SaleDetailDialog.tsx:165` | Alta |
| CONF-03 | Cambiar el estado de una orden de trabajo, incluido "Entregado" | `ordenes-trabajo/components/ListOrdenesTrabajo/columns.tsx:93` | Alta |
| CONF-04 | Generar boleta de una venta | `ventas/components/ListVentas/columns.tsx:52` | Media |
| CONF-05 | Generar boleta de una orden de trabajo | `ordenes-trabajo/components/ListOrdenesTrabajo/columns.tsx:78` | Media |
| CONF-06 | Cambiar el rol de un usuario | `usuarios/components/ListUsuarios/ListUsuarios.tsx:152` | Media |

### 3.3 Aceptables por tener formulario propio

Estas acciones no tienen un diálogo de confirmación, pero se ejecutan dentro de un formulario modal donde el usuario debe ingresar datos y presionar "Guardar", lo que cumple la intención del CU92. Se dejan registradas por si el equipo decide subir el estándar.

| Acción | Archivo |
|---|---|
| Registrar movimiento de bodega (entrada o salida manual) | `inventory/components/InventoryMovementDialog/InventoryMovementDialog.tsx` |
| Registrar pago de venta y de orden de trabajo | `SalePayDialog.tsx`, `OrderPayDialog.tsx` |
| Reprogramar la entrega de una orden | `ListOrdenesTrabajo/RescheduleDialog.tsx` |
| Modificar el servicio de una orden | `ListOrdenesTrabajo/ModifyServiceDialog.tsx` |
| Editar precio o descuento de una línea | `ListOrdenesTrabajo/AssignSuppliesDialog.tsx:397` |

---

## 4. Bugs a levantar

### BUG-CONF-01 — Anular una venta no pide confirmación

**Severidad:** Alta
**Módulo:** Punto de venta / Ventas
**Archivos:** `app/(routes)/punto-ventas/ventas/components/ListVentas/columns.tsx:82` y `SaleDetailDialog.tsx:165`

**Pasos para reproducir**
1. Ingresar como Vendedor o Administrador.
2. Entrar a Punto de Venta, pestaña Ventas.
3. Abrir el menú de acciones de cualquier venta y presionar "Anular Venta".

**Resultado esperado:** se muestra un diálogo que indica el número de la venta y su monto, y pide confirmar la anulación.

**Resultado actual (verificado en ejecución el 29-09-2026):** la venta #venta-73, de $45.000, quedó anulada de inmediato con un solo clic. El único aviso es el mensaje posterior "Venta actualizada correctamente", que ni siquiera menciona que se anuló. No hay forma de revertirla desde la interfaz.

**Evidencia:** `evidencias/cu47/conf-01-menu-anular-venta.jpg` y `evidencias/cu47/conf-01-venta-anulada-sin-confirmar.jpg`

**Nota:** el mismo botón existe dentro del detalle de la venta, y tampoco confirma. La anulación de orden de trabajo sí tiene diálogo, así que además hay una inconsistencia entre dos módulos equivalentes.

---

### BUG-CONF-02 — Cambiar el estado de una orden de trabajo no pide confirmación

**Severidad:** Alta
**Módulo:** Órdenes de trabajo
**Archivo:** `app/(routes)/punto-ventas/ordenes-trabajo/components/ListOrdenesTrabajo/columns.tsx:93`

**Pasos para reproducir**
1. Abrir el menú de acciones de una orden en estado "Listo para entregar".
2. Presionar "Mover a: Entregado".

**Resultado esperado:** se pide confirmación, porque "Entregado" es un estado terminal: desde él no existe ninguna transición de vuelta (`app/api/punto-venta/[idPuntoVenta]/estado/route.ts:14-21`) y además bloquea la anulación posterior de la orden.

**Resultado actual:** el estado cambia con un solo clic desde el menú desplegable, que ofrece las transiciones directamente como "→ Mover a: Entregado".

**Evidencia:** `evidencias/cu47/conf-02-cambio-estado-sin-confirmacion.jpg`

---

### BUG-CONF-03 — Generar boleta no pide confirmación

**Severidad:** Media
**Módulo:** Ventas y órdenes de trabajo
**Archivos:** `ListVentas/columns.tsx:52`, `ListOrdenesTrabajo/columns.tsx:78`

**Resultado esperado:** al emitir un documento tributario se consume un folio, así que debe confirmarse indicando el tipo de documento y el monto.

**Resultado actual:** la boleta se emite con un clic.

---

### BUG-CONF-04 — Cambiar el rol de un usuario no pide confirmación

**Severidad:** Media
**Módulo:** Usuarios
**Archivo:** botón en `ListUsuarios.tsx:152`, manejador `updateUserRole` en `ListUsuarios.tsx:278`

**Resultado esperado:** al cambiar un rol se cambian los permisos de acceso de esa persona, por ejemplo al promoverla a Administrador, así que debe confirmarse nombrando el rol anterior y el nuevo.

**Resultado actual:** el rol se guarda de inmediato al presionar el botón de guardar de la fila. En contraste, quitar el rol sí abre un `AlertDialog`, o sea que la inconsistencia está dentro del mismo módulo.

---

## 5. Corrección propuesta

Los cuatro bugs se resuelven con un único componente reutilizable, porque hoy cada diálogo de confirmación está escrito a mano y por eso quedaron módulos sin cubrir.

Se propone crear `components/common/ConfirmDialog` sobre el `AlertDialog` que ya existe en `components/ui/alert-dialog.tsx`, con esta interfaz:

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Anular venta #128"
  description="La venta por $45.900 quedará anulada. Esta acción no se puede deshacer."
  confirmLabel="Anular venta"
  variant="destructive"
  isLoading={isAnulando}
  onConfirm={handleAnular}
/>
```

Luego se reemplazan los diálogos escritos a mano de `CancelOrderDialog` y `ListUsuarios`, para que el estándar quede en un solo lugar.

---

## 6. Hallazgos adicionales

Se encontraron durante la auditoría. No corresponden al CU92, pero conviene levantarlos como bugs aparte porque son de mayor impacto que los anteriores.

| # | Hallazgo | Evidencia |
|---|---|---|
| 1 | **Anular una orden de trabajo no devuelve el stock.** Verificado: la orden #26 consumía 2 unidades del producto #113, que quedó en 36 unidades en vez de volver a 38. | Descuento en `app/api/ordenes-trabajo/route.ts:853`; anulación en `app/api/punto-venta/[idPuntoVenta]/estado/route.ts:393-448`. Detalle en `cu47-anulando-orden-de-trabajo.md` |
| 2 | **Anular una venta no devuelve el stock, no registra auditoría y no valida nada.** Verificado con la venta #venta-73: el producto #122 quedó en 22 unidades en vez de volver a 25, no se generó ningún registro de auditoría, y volver a anularla por API respondió `200` en lugar de rechazar la operación. | `app/api/punto-venta/[idPuntoVenta]/estado/route.ts:230-251` |
| 3 | **Los movimientos de inventario de ventas y órdenes no se registran.** El stock se modifica directamente sobre `productos.stock_actual`, sin insertar en `movimientos_inventario`. Solo el módulo de ajustes de bodega deja trazabilidad. | `app/api/ordenes-trabajo/route.ts:845-856`, `app/api/ordenes-trabajo/[idVenta]/servicios/route.ts:233` |
| 4 | **Anular una venta exige el permiso `SALES_CREATE`.** Quien puede crear una venta puede anular cualquier venta. Debería existir un permiso propio, como ya ocurre con `WORK_ORDERS_UPDATE_STATUS`. | `app/api/punto-venta/[idPuntoVenta]/estado/route.ts:122-125` |
| 5 | **Los endpoints de eliminación no tienen interfaz.** Existen `DELETE` para productos, clientes, bicicletas, proveedores y servicios, pero ninguna pantalla los llama. Conviene revisar cómo se verificaron CU9, CU26 y CU34, porque desde la interfaz no son ejecutables. | `app/api/inventory/[id]/route.ts`, `app/api/clientes/route.ts`, `app/api/bicycles/[id]/route.ts`, `app/api/proveedores/[id]/route.ts`, `app/api/servicios/[id]/route.ts` |

---

## 7. Problemas del entorno local encontrados al ejecutar las pruebas

Estos no son del CU92, pero bloquean a cualquier integrante que clone `main` y quiera levantar el proyecto.

| # | Problema | Estado |
|---|---|---|
| 1 | **El seed estaba roto.** `prisma/seed.ts:721` creaba las asignaciones de pago con el campo `idVenta`, que dejó de aceptarse cuando cambió el esquema en el PR #145. En una creación anidada hay que conectar la relación. | Corregido en este cambio |
| 2 | **El cliente de Prisma generado estaba desactualizado**, sin el campo `sessionVersion`. Cualquier página autenticada respondía error 500. Se resuelve con `npx prisma generate`. | Documentado |
| 3 | **La base local no tenía aplicadas las migraciones** y quedó con llaves foráneas del esquema antiguo. `prisma migrate deploy` falla con `P3005` porque la base nunca fue baselineada. | Documentado |
| 4 | **Faltaban dependencias en `node_modules`** (`cn`, `jspdf`, `html2canvas-pro`), así que el módulo Punto de Venta no compilaba. Se resuelve con `npm install`. | Documentado |
| 5 | **El Dashboard muestra datos falsos.** Con la base sembrada mostraba 142 productos y 95 clientes, cuando en realidad hay 26 y 10. Las tarjetas están escritas a mano en el código. | Por levantar |

Conviene dejar en el README los cuatro pasos para un entorno limpio: `npm install`, `npx prisma generate`, `npx prisma db push` y `npm run seed`.

---

## 8. Método

La revisión se hizo sobre el código de `main`, buscando todas las llamadas a la API que modifican datos desde la interfaz (`fetch` con método `POST`, `PATCH`, `PUT` o `DELETE` dentro de `app/(routes)` y `components`), y revisando para cada una si existe un diálogo de confirmación entre el clic del usuario y la llamada. Se revisó además el uso del componente `AlertDialog` en todo el proyecto, que hoy aparece en un solo archivo.
