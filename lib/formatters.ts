export type ClienteNombreInput = {
  razonSocial?: string | null;
  primerNombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
} | null | undefined;

export function formatClientName(cliente: ClienteNombreInput): string {
  if (!cliente) return "Sin cliente";

  if (cliente.razonSocial && cliente.razonSocial.trim()) {
    return cliente.razonSocial.trim();
  }

  const parts = [
    cliente.primerNombre,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ").trim();
  }

  return "Sin cliente";
}
