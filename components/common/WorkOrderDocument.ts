/**
 * WorkOrderDocument.ts
 *
 * Utilidades para generar el documento HTML de una Orden de Trabajo.
 * Reutilizable desde cualquier módulo (impresión, descarga PDF, etc.).
 *
 * NO importa React ni dependencias del navegador — solo genera strings HTML.
 */

import type { WorkOrder } from "@/app/(routes)/punto-ventas/ordenes-trabajo/types"

/** Determina si una orden está completamente pagada. */
export function isWorkOrderPaid(order: WorkOrder): boolean {
  const total = Number(order.total || 0)
  const totalPagado = Number(order.totalPagado || 0)
  return (
    order.estadoPago?.toLowerCase() === "pagada" ||
    order.estadoPago?.toLowerCase() === "pagado" ||
    Math.max(0, total - totalPagado) === 0
  )
}

/** Retorna el nombre estandarizado del archivo para esta orden. */
export function workOrderFileName(order: WorkOrder): string {
  return `Orden de trabajo #${order.idOrdenDeTrabajo}.pdf`
}

/**
 * Genera el HTML interno del documento (sin <html>/<head>).
 * Usa únicamente colores hexadecimales — compatible con html2canvas-pro,
 * html2canvas legacy y cualquier motor de impresión.
 */
export function buildWorkOrderContent(order: WorkOrder): string {
  const clientName = order.cliente
    ? [
        order.cliente.primerNombre,
        order.cliente.segundoNombre,
        order.cliente.apellidoPaterno,
        order.cliente.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(" ") ||
      order.cliente.razonSocial ||
      "Cliente Particular"
    : "Cliente Particular"

  const lines = order.lineasDeOrdenDeTrabajo || []
  const payments = order.pagos || []
  const bikes = order.bicicletas || []
  const total = Number(order.total || 0)
  const totalPagado = Number(order.totalPagado || 0)
  const saldoPendiente = Math.max(0, total - totalPagado)
  const paid = isWorkOrderPaid(order)

  const fechaRecepcion = order.fechaRecepcion
    ? new Date(order.fechaRecepcion).toLocaleDateString("es-CL")
    : "—"
  const fechaEntrega = order.fechaEntregaEstimada
    ? new Date(order.fechaEntregaEstimada).toLocaleDateString("es-CL")
    : "—"

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;background:#fff;padding:20px;font-size:11.5px;line-height:1.45;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #004D70;padding-bottom:12px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(0,77,112,0.08);border:1px solid rgba(0,77,112,0.2);display:flex;align-items:center;justify-content:center;padding:5px;">
            <svg viewBox="0 0 59 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M24.6625 0C29.5499 0.000157557 33.512 3.87456 33.5121 8.65224C33.5121 8.91866 33.4997 9.18398 33.4824 9.44828H40.9366C48.1871 9.44828 51.0342 18.6407 45.0014 22.5723L37.1131 27.7122C35.415 28.8193 35.8805 31.3743 37.8654 31.84C38.5143 31.9921 39.1997 31.8658 39.7475 31.4934L44.3242 28.1927C44.4979 28.0675 44.7074 28 44.9225 28H57.4922C57.9872 28 58.1886 28.6281 57.7838 28.909L44.4783 38.1397C41.99 39.8319 38.8796 40.4048 35.9321 39.7133C26.9186 37.5986 24.8061 26.0015 32.5185 20.9749L37.7818 17.5457H29.7048H24.5358C23.0515 17.5457 21.6504 17.1926 20.4171 16.5691C21.7314 17.4535 24.9805 18.4377 27.7216 18.6251C27.9658 18.6251 28.3625 18.8385 27.8901 19.3183L11.2952 35.7067C11.105 35.8945 10.847 36 10.578 36H0.507884C0.056246 36 -0.169872 35.4613 0.149574 35.1463L19.5219 16.0472C17.1349 14.4709 15.5652 11.8013 15.5649 8.77349C15.5649 3.92875 19.5825 0 24.5385 0H24.6625ZM24.8419 6.74915C23.6982 6.74915 22.771 7.35337 22.771 8.09871C22.7715 8.71319 23.4024 9.23009 24.2648 9.39292C24.3487 9.42847 24.4413 9.44828 24.5385 9.44828H25.1533C25.1544 9.44225 25.1535 9.43586 25.1546 9.42983C26.1495 9.33152 26.9122 8.77441 26.9127 8.09871C26.9127 7.35337 25.9855 6.74915 24.8419 6.74915Z" fill="#004D70"/>
            </svg>
          </div>
          <div>
            <div style="font-size:18px;font-weight:800;color:#004D70;margin:0;line-height:1.1;">Urban Cycling</div>
            <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;font-weight:600;">Taller de Servicio &amp; Gestión</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:17px;font-weight:800;color:#004D70;margin:0;">ORDEN DE TRABAJO #${order.idOrdenDeTrabajo}</div>
          <div style="font-size:10.5px;color:#64748b;margin-top:2px;">Fecha Emisión: ${new Date().toLocaleDateString("es-CL")}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;margin-bottom:14px;">
        <div>
          <div style="font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;color:#475569;font-weight:700;margin-bottom:6px;">Datos del Cliente</div>
          <p style="margin:2px 0;"><span style="color:#64748b;font-weight:500;">Nombre:</span> <strong>${clientName}</strong></p>
          ${order.cliente?.rut ? `<p style="margin:2px 0;"><span style="color:#64748b;font-weight:500;">RUT:</span> ${order.cliente.rut}</p>` : ""}
          <p style="margin:2px 0;"><span style="color:#64748b;font-weight:500;">Recepción:</span> ${fechaRecepcion}</p>
          <p style="margin:2px 0;"><span style="color:#64748b;font-weight:500;">Entrega Estimada:</span> ${fechaEntrega}</p>
        </div>
        <div>
          <div style="font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;color:#475569;font-weight:700;margin-bottom:6px;">Estado de la Orden</div>
          <p style="margin:2px 0;"><span style="color:#64748b;font-weight:500;">Estado:</span> <span style="font-weight:700;text-transform:uppercase;letter-spacing:0.3px;color:#0284c7;">${order.estadoOrden}</span></p>
          <p style="margin:2px 0;"><span style="color:#64748b;font-weight:500;">Estado Pago:</span> <span style="font-weight:700;text-transform:uppercase;letter-spacing:0.3px;color:${paid ? "#16a34a" : "#d97706"};">${order.estadoPago || (paid ? "Pagada" : "Pendiente")}</span></p>
          ${bikes.length > 0 ? `<p style="margin:2px 0;"><span style="color:#64748b;font-weight:500;">Bicicleta:</span> ${bikes.map((b) => `${b.marca} ${b.modelo} (${b.color})`).join(", ")}</p>` : ""}
        </div>
      </div>

      ${order.observacionesIngreso ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;padding:8px 12px;border-radius:4px;font-size:11px;color:#92400e;margin-bottom:12px;">
        <strong>Observaciones de Ingreso:</strong> ${order.observacionesIngreso}
      </div>` : ""}

      <!-- Tabla Líneas -->
      <div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#004D70;margin:14px 0 6px 0;padding-bottom:3px;border-bottom:1.5px solid #cbd5e1;">Detalle de Servicios e Insumos</div>
      <table style="width:100%;border-collapse:collapse;margin-top:4px;font-size:11px;">
        <thead>
          <tr>
            <th style="width:46%;background:#f1f5f9;color:#334155;text-align:left;font-weight:700;padding:6px 8px;border:1px solid #cbd5e1;text-transform:uppercase;font-size:10px;">Descripción</th>
            <th style="width:14%;background:#f1f5f9;color:#334155;text-align:center;font-weight:700;padding:6px 8px;border:1px solid #cbd5e1;text-transform:uppercase;font-size:10px;">Tipo</th>
            <th style="width:10%;background:#f1f5f9;color:#334155;text-align:center;font-weight:700;padding:6px 8px;border:1px solid #cbd5e1;text-transform:uppercase;font-size:10px;">Cant.</th>
            <th style="width:15%;background:#f1f5f9;color:#334155;text-align:right;font-weight:700;padding:6px 8px;border:1px solid #cbd5e1;text-transform:uppercase;font-size:10px;">Precio Unit.</th>
            <th style="width:15%;background:#f1f5f9;color:#334155;text-align:right;font-weight:700;padding:6px 8px;border:1px solid #cbd5e1;text-transform:uppercase;font-size:10px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${lines.length === 0
            ? `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:10px;border:1px solid #e2e8f0;">Sin líneas registradas</td></tr>`
            : lines.map((l) => `
            <tr>
              <td style="padding:6px 8px;border:1px solid #e2e8f0;">${l.servicio?.nombre || l.producto?.nombre || "Ítem sin descripción"}</td>
              <td style="text-align:center;padding:6px 8px;border:1px solid #e2e8f0;">${l.idServicio ? "Servicio" : "Insumo"}</td>
              <td style="text-align:center;padding:6px 8px;border:1px solid #e2e8f0;">${l.cantidad}</td>
              <td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">$${Number(l.precioUnitario).toLocaleString("es-CL")}</td>
              <td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">$${(l.cantidad * Number(l.precioUnitario)).toLocaleString("es-CL")}</td>
            </tr>`).join("")}
        </tbody>
      </table>

      <!-- Totales -->
      <div style="display:flex;justify-content:flex-end;margin-top:12px;">
        <table style="width:260px;border-collapse:collapse;font-size:11.5px;">
          <tr>
            <td style="padding:4px 6px;color:#64748b;font-weight:500;">Total Orden:</td>
            <td style="padding:4px 6px;text-align:right;"><strong>$${total.toLocaleString("es-CL")}</strong></td>
          </tr>
          <tr>
            <td style="padding:4px 6px;color:#64748b;font-weight:500;">Total Pagado:</td>
            <td style="padding:4px 6px;text-align:right;color:#16a34a;">$${totalPagado.toLocaleString("es-CL")}</td>
          </tr>
          <tr style="border-top:2px solid #004D70;">
            <td style="padding:6px 6px 4px 6px;font-weight:800;font-size:13px;color:#004D70;">Saldo Pendiente:</td>
            <td style="padding:6px 6px 4px 6px;text-align:right;font-weight:800;font-size:13px;color:${saldoPendiente > 0 ? "#d97706" : "#16a34a"};">$${saldoPendiente.toLocaleString("es-CL")}</td>
          </tr>
        </table>
      </div>

      <!-- Pagos -->
      ${payments.length > 0 ? `
      <div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#004D70;margin:14px 0 6px 0;padding-bottom:3px;border-bottom:1.5px solid #cbd5e1;">Historial de Pagos</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr>
            <th style="background:#f1f5f9;color:#334155;text-align:left;font-weight:700;padding:6px 8px;border:1px solid #cbd5e1;text-transform:uppercase;font-size:10px;">Método</th>
            <th style="background:#f1f5f9;color:#334155;text-align:left;font-weight:700;padding:6px 8px;border:1px solid #cbd5e1;text-transform:uppercase;font-size:10px;">Fecha</th>
            <th style="background:#f1f5f9;color:#334155;text-align:right;font-weight:700;padding:6px 8px;border:1px solid #cbd5e1;text-transform:uppercase;font-size:10px;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map((p) => `
            <tr>
              <td style="padding:6px 8px;border:1px solid #e2e8f0;">${p.metodoPago || "—"}</td>
              <td style="padding:6px 8px;border:1px solid #e2e8f0;">${p.fechaRegistro ? new Date(p.fechaRegistro).toLocaleDateString("es-CL") : "—"}</td>
              <td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">$${Number(p.monto).toLocaleString("es-CL")}</td>
            </tr>`).join("")}
        </tbody>
      </table>` : ""}

      <div style="margin-top:20px;padding-top:8px;border-top:1px solid #e2e8f0;text-align:center;font-size:9.5px;color:#94a3b8;">
        Urban Cycling — Comprobante oficial de Orden de Trabajo #${order.idOrdenDeTrabajo} emitido el ${new Date().toLocaleString("es-CL")}
      </div>
    </div>
  `
}

/**
 * Genera el documento HTML completo (con DOCTYPE, <head> y <body>)
 * listo para inyectar en un iframe para imprimir o convertir a PDF.
 *
 * El <title> determina el nombre por defecto cuando el usuario guarda
 * el documento como PDF desde el diálogo de impresión del navegador.
 */
export function buildWorkOrderHtml(order: WorkOrder): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Orden de trabajo #${order.idOrdenDeTrabajo}</title>
  <style>
    @page { size: letter portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #fff; }
  </style>
</head>
<body>
  ${buildWorkOrderContent(order)}
</body>
</html>`
}
