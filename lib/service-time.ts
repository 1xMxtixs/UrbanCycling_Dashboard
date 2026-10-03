const MS_PER_DAY = 86_400_000;
const SHOP_TIME_ZONE = "America/Santiago";

const DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Calendar day in the shop's time zone as a UTC midnight timestamp, so DST shifts don't skew the diff.
function calendarDayUtc(date: Date) {
  const parts = DATE_PARTS_FORMATTER.formatToParts(date);
  const getPart = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value);

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");

  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
    ? Date.UTC(year, month - 1, day)
    : Number.NaN;
}

/**
 * Calendar days between a work order's intake and its effective delivery (UR 5.15).
 * Returns null when either date is invalid or delivery precedes intake.
 */
export function calcularDiasServicio(
  fechaIngreso: Date | null | undefined,
  fechaEntrega: Date | null | undefined
): number | null {
  if (!fechaIngreso || !fechaEntrega) return null;
  if (Number.isNaN(fechaIngreso.getTime()) || Number.isNaN(fechaEntrega.getTime())) return null;

  const ingresoUtc = calendarDayUtc(fechaIngreso);
  const entregaUtc = calendarDayUtc(fechaEntrega);

  if (Number.isNaN(ingresoUtc) || Number.isNaN(entregaUtc)) return null;

  const dias = (entregaUtc - ingresoUtc) / MS_PER_DAY;
  return dias < 0 ? null : dias;
}
