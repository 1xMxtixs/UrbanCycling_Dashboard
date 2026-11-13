type PaymentAssignment = {
  montoAsociado: unknown
  pago?: { estado?: string } | null
}

/** Los pagos fallidos, pendientes, anulados o reembolsados no reducen el saldo. */
export function sumarPagosCompletados(assignments: PaymentAssignment[]) {
  return assignments.reduce(
    (total, assignment) =>
      assignment.pago?.estado === "COMPLETADO"
        ? total + Number(assignment.montoAsociado)
        : total,
    0
  )
}
