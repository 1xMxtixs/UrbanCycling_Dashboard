import type { StatusType } from "@/components/common/StatusBadge";
import type { EstadoGarantia, EstadoGarantiaCodigo } from "@/app/(routes)/garantias/types";

export const ESTADO_GARANTIA_CODIGO = {
  INGRESADO: "INGRESADO",
  EN_REVISION: "EN_REVISION",
  EN_ESPERA: "EN_ESPERA",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
} as const;

export const NOMBRES_ESTADO_GARANTIA: Record<EstadoGarantiaCodigo, EstadoGarantia> = {
  INGRESADO: "Ingresado",
  EN_REVISION: "En Revisión",
  EN_ESPERA: "En espera",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export function normalizarCodigoEstado(
  estado: unknown
): EstadoGarantiaCodigo | null {
  let codigo = "";

  if (typeof estado === "string") {
    codigo = estado;
  } else if (
    estado &&
    typeof estado === "object"
  ) {
    const objeto = estado as {
      codigo?: unknown;
      code?: unknown;
      nombre?: unknown;
      name?: unknown;
    };

    codigo =
      typeof objeto.codigo === "string"
        ? objeto.codigo
        : typeof objeto.code === "string"
        ? objeto.code
        : typeof objeto.nombre === "string"
        ? objeto.nombre
        : typeof objeto.name === "string"
        ? objeto.name
        : "";
  }

  const estadoNormalizado = codigo
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replaceAll(" ", "_");

  switch (estadoNormalizado) {
    case "INGRESADO":
      return "INGRESADO";

    case "EN_REVISION":
      return "EN_REVISION";

    case "EN_ESPERA":
      return "EN_ESPERA";

    case "APROBADO":
    case "APROBADA":
      return "APROBADO";

    case "RECHAZADO":
    case "RECHAZADA":
      return "RECHAZADO";

    default:
      return null;
  }
}

export function resolveGarantiaStatusType(codigo: EstadoGarantiaCodigo): StatusType {
  switch (codigo) {
    case "APROBADO":
      return "success";
    case "RECHAZADO":
      return "danger";
    case "EN_REVISION":
      return "warning";
    case "INGRESADO":
    case "EN_ESPERA":
    default:
      return "neutral";
  }
}

