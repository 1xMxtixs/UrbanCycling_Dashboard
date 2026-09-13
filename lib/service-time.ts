const MS_PER_DAY = 86_400_000;
const SHOP_TIME_ZONE = "America/Santiago";

// Calendar day in the shop's time zone as a UTC midnight timestamp, so DST shifts don't skew the diff.
function calendarDayUtc(date: Date) {
  const [year, month, day] = date
    .toLocaleDateString("en-CA", { timeZone: SHOP_TIME_ZONE })
    .split("-")
    .map(Number);
  return Date.UTC(year, month - 1, day);
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

  const dias = (calendarDayUtc(fechaEntrega) - calendarDayUtc(fechaIngreso)) / MS_PER_DAY;
  return dias < 0 ? null : dias;
}
