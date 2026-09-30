# CU47 — Anulando orden de trabajo

| | |
|---|---|
| **Tarea Jira** | UC-154 / [T3-54] |
| **Fecha de ejecución** | 29-09-2026 |
| **Rama verificada** | `main` en el commit `f43fdef` |
| **Ambiente** | Local, base sembrada con `npm run seed`, sesión de Administrador |
| **Resultado** | 3 casos de prueba pasan, 1 falla. Se detectaron 3 defectos (sección 6) |

---

## 1. Caso de uso extendido

| Campo | Contenido |
|---|---|
| **Identificador** | CU47 |
| **Nombre** | Anulando orden de trabajo |
| **Actor principal** | Administrador |
| **Actores secundarios** | Vendedor y Asesor técnico, siempre que su rol tenga el permiso `work_orders:update_status` |
| **Descripción** | El actor deja sin efecto una orden de trabajo vigente, dejando registro de quién la anuló y cuándo |
| **Precondiciones** | 1. El actor está autenticado.<br>2. El actor posee el permiso `work_orders:update_status`.<br>3. Existe una orden de trabajo cuyo estado no es "Entregado" ni "Anulada" |
| **Postcondiciones** | 1. La orden queda en estado "Anulada".<br>2. Se registra en auditoría la operación `anulacion_orden` con el estado anterior y el nuevo.<br>3. La orden deja de aceptar cambios de estado y ya no ofrece el botón Editar |
| **Requerimientos asociados** | RF de gestión de órdenes de trabajo; UR de trazabilidad de acciones críticas |
| **Frecuencia de uso** | Baja |

### Flujo principal

1. El actor **ingresando** al módulo Punto de Venta, pestaña Órdenes de Trabajo.
2. El actor **ubicando** la orden que desea anular y **abriendo** su menú de acciones.
3. El actor **seleccionando** Ver Detalle y luego **presionando** Editar, con lo que el sistema **abriendo** la Edición Integral de la orden.
4. El actor **presionando** Anular Orden.
5. El sistema **mostrando** un diálogo de confirmación con el número de la orden, su estado actual y la advertencia de que la acción no se puede deshacer.
6. El actor **confirmando** la anulación.
7. El sistema **validando** que la orden exista y que su estado permita anularla.
8. El sistema **actualizando** el estado de la orden a "Anulada" dentro de una transacción.
9. El sistema **registrando** en auditoría la operación, el usuario responsable, el estado anterior y el estado nuevo.
10. El sistema **informando** al actor con el mensaje "Orden de trabajo anulada correctamente" y **refrescando** el listado, donde la orden aparece con la etiqueta "Anulada".

> **Nota de implementación.** La anulación solo está disponible por la Edición Integral. El menú de la fila ofrece únicamente Ver Detalle, Generar Boleta y los cambios de estado. Ver el defecto BUG-CU47-02.

### Flujos alternativos

**FA-1. El actor desiste de la anulación.**
En el paso 6, el actor **presionando** Cancelar o **cerrando** el diálogo. El sistema **cerrando** el diálogo sin modificar la orden.

### Excepciones

**EX-1. Estado no permite la anulación.**
En el paso 7, si la orden ya está en estado "Entregado" o "Anulada", el sistema **respondiendo** con el código `ANULACION_NO_PERMITIDA` y el estado HTTP 409. La orden no se modifica. En la interfaz esta situación no llega a producirse, porque las órdenes entregadas y anuladas no ofrecen el botón Editar.

**EX-2. La orden no existe.**
En el paso 7, si la orden fue eliminada o el identificador es inválido, el sistema **respondiendo** con el código `ORDEN_NO_EXISTE`.

**EX-3. El actor no tiene permiso.**
En el paso 7, si el rol del actor no incluye `work_orders:update_status`, el sistema **rechazando** la petición y **manteniendo** la orden sin cambios.

**EX-4. Falla la transacción.**
En el paso 8, si la base de datos falla, el sistema **revirtiendo** la transacción completa, de modo que ni el estado ni la auditoría quedan modificados, y **mostrando** el mensaje "No se pudo anular la orden".

---

## 2. Reglas de negocio verificadas

| Regla | Dónde está implementada | Verificada |
|---|---|---|
| Solo se puede anular una orden que no esté "Entregado" ni "Anulada" | `app/api/punto-venta/[idPuntoVenta]/estado/route.ts:298-307` | Sí, CP-47-02 |
| El estado "Anulada" es terminal: no tiene transiciones de salida | `app/api/punto-venta/[idPuntoVenta]/estado/route.ts:14-21` | Sí, CP-47-01 |
| La anulación exige el permiso `work_orders:update_status` | `app/api/punto-venta/[idPuntoVenta]/estado/route.ts:122-126` | Por código |
| El cambio de estado y la auditoría ocurren en una sola transacción | `app/api/punto-venta/[idPuntoVenta]/estado/route.ts:348-448` | Por código |
| La auditoría guarda la operación, el usuario, el valor anterior y el nuevo | `app/api/punto-venta/[idPuntoVenta]/estado/route.ts:423-444` | Sí, CP-47-01 |
| La anulación pide confirmación explícita | `ListOrdenesTrabajo/AssignSuppliesDialog.tsx:1095` | Sí, CP-47-01 |
| Al anular se devuelve el stock de los repuestos | No implementada | **Falla**, CP-47-04 |

---

## 3. Componentes que participan

| Capa | Componente |
|---|---|
| Interfaz | `OrderDetailDialog.tsx` (botón Editar), `AssignSuppliesDialog.tsx:1073-1144` (botón Anular Orden y su confirmación) |
| API | `PATCH /api/punto-venta/orden-{id}/estado` con `{ estado: "Anulada" }` |
| Autorización | `lib/require-permission.ts` |
| Persistencia | Prisma, tabla `ordenes_de_trabajo` |
| Auditoría | `lib/work-order-audit.ts`, tabla `auditoria` |

`CancelOrderDialog.tsx` existe y está montado en `ListOrdenesTrabajo.tsx:632`, pero ningún elemento de la interfaz lo abre. Ver BUG-CU47-02.

---

## 4. Casos de prueba ejecutados

Datos de prueba: órdenes #25 (Entregado), #26 (Listo para entregar), #28 (Por realizar).

### CP-47-01 — Anulación exitosa de una orden vigente ✅ PASA

**Precondición:** sesión de Administrador. Orden #26 en estado "Listo para entregar", cliente Pedro Ramírez Soto.

| Paso | Acción | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|
| 1 | Abrir el detalle de la orden #26 y presionar Editar | Se abre la Edición Integral | Correcto | — |
| 2 | Presionar Anular Orden | Se muestra el diálogo con el número de orden y el estado actual | Muestra "Orden #26, Estado actual: Listo para entregar" y la advertencia de que no se puede deshacer | `evidencias/cu47/cp-47-01-dialogo-confirmacion.jpg` |
| 3 | Presionar Confirmar Anulación | Mensaje de éxito | "Orden de trabajo anulada correctamente" | `evidencias/cu47/cp-47-01-mensaje-exito.jpg` |
| 4 | Observar el listado | La orden aparece como Anulada | La fila #26 muestra la etiqueta "Anulada" | `evidencias/cu47/cp-47-01-listado-anulada.jpg` |
| 5 | Abrir el detalle de la orden | Ya no ofrece editar ni cambiar estado | El pie solo muestra Registrar Pago, Ver auditoría y Exportar | `evidencias/cu47/cp-47-01-detalle-anulada.jpg` |
| 6 | Presionar Ver auditoría | Registro de la anulación | "Anulacion_orden — Admin Sistema — 29-09-2026, 9:39 p.m." con el cambio `estado: Listo-para-entregar → Anulada` | `evidencias/cu47/cp-47-01-auditoria.jpg` |

### CP-47-02 — El sistema impide anular una orden ya entregada ✅ PASA

**Precondición:** orden #25 en estado "Entregado", cliente María López Rojas.

| Paso | Acción | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|
| 1 | Abrir el menú de acciones de la orden #25 | No se ofrece anular ni cambiar estado | Solo aparecen Ver Detalle y Generar Boleta | `evidencias/cu47/cp-47-02-menu-orden-entregada.jpg` |
| 2 | Abrir el detalle de la orden | No se ofrece el botón Editar, que es la vía a la anulación | El pie solo muestra Generar Boleta, Ver auditoría y Exportar | `evidencias/cu47/cp-47-02-detalle-sin-editar.jpg` |
| 3 | Forzar la anulación llamando directamente a `PATCH /api/punto-venta/orden-25/estado` con `{ estado: "Anulada" }` | La API rechaza la operación | `409` con `{ code: "ANULACION_NO_PERMITIDA", message: "La orden ya se encuentra Entregada o Anulada" }` | Respuesta registrada en la consola del navegador |

### CP-47-03 — El actor desiste de la anulación ✅ PASA

| Paso | Acción | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|
| 1 | Abrir el diálogo de anulación de la orden #26 | Se muestra el diálogo | Correcto | — |
| 2 | Presionar Cancelar | El diálogo se cierra y la orden mantiene su estado | La orden sigue en "Listo para entregar" | `evidencias/cu47/cp-47-03-desistir.jpg` |

### CP-47-04 — Al anular se devuelve el stock de los repuestos ❌ FALLA

**Precondición:** la orden #26 consume 2 unidades del producto #113 "Pastillas de Freno Resina", que tiene 36 unidades en stock.

| Paso | Acción | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| 1 | Consultar el stock del producto #113 antes de anular | 36 unidades | 36 unidades |
| 2 | Anular la orden #26 | La orden queda anulada | Correcto |
| 3 | Consultar el stock del producto #113 después de anular | **38 unidades**, porque los repuestos no se usaron | **36 unidades**, el stock no se devolvió |

Este caso origina el defecto BUG-CU47-01.

---

## 5. Diagrama de secuencia

Archivo: `docs/diagramas/cu47-anulando-orden-de-trabajo.drawio`

---

## 6. Defectos detectados

### BUG-CU47-01 — Anular una orden de trabajo no devuelve el stock de los repuestos

**Severidad:** Alta
**Módulo:** Órdenes de trabajo e Inventario

Al crear la orden se descuenta el stock de los productos (`app/api/ordenes-trabajo/route.ts:845-856`), y lo mismo ocurre al agregar servicios con repuestos (`app/api/ordenes-trabajo/[idVenta]/servicios/route.ts:233`). Al anular, la transacción solo actualiza el estado y registra la auditoría (`app/api/punto-venta/[idPuntoVenta]/estado/route.ts:393-448`): nunca devuelve las unidades.

**Verificado en CP-47-04:** el producto #113 quedó con 36 unidades cuando debía volver a 38.

**Observación:** los descuentos de stock por órdenes y por ventas modifican `productos.stock_actual` directamente, sin insertar en `movimientos_inventario`, así que tampoco existe un movimiento que revertir. Conviene resolver ambos puntos juntos.

### BUG-CU47-02 — La anulación no está disponible desde el listado ni desde el detalle

**Severidad:** Media
**Módulo:** Órdenes de trabajo

`ListOrdenesTrabajo.tsx` define `handleCancelClick`, lo pasa como `onCancelClick` a la tabla y al detalle (líneas 565 y 582) y monta `CancelOrderDialog` (línea 632). Sin embargo, ni `columns.tsx` ni `OrderDetailDialog.tsx` llaman jamás a esa función, así que el diálogo nunca se abre: es código muerto.

En la práctica, para anular hay que entrar a Ver Detalle, presionar Editar y buscar el botón al final de un formulario de edición. Es poco descubrible para un flujo que el usuario piensa como una acción directa.

**Corrección sugerida:** invocar `onCancelClick` desde el menú de la fila y desde el pie del detalle, y eliminar la duplicación dejando un solo diálogo de confirmación.

### BUG-CU47-03 — El detalle de la orden no refleja la anulación hasta reabrirlo

**Severidad:** Baja
**Módulo:** Órdenes de trabajo

Tras confirmar la anulación desde la Edición Integral, el diálogo de detalle que queda abajo sigue mostrando la etiqueta del estado anterior ("Por Entregar"). El listado sí se actualiza. Al cerrar y volver a abrir el detalle, el estado aparece correcto.
