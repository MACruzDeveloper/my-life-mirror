/**
 * Ventanas de tiempo por meses completos, para que varios gráficos muestren
 * exactamente el mismo periodo (pequeños múltiplos comparables).
 */

export const PERIODS = ["6m", "12m", "all"] as const;
export type Period = (typeof PERIODS)[number];

export interface TimeWindow {
  start: Date;
  /** Exclusivo: primer día del mes siguiente al último mostrado. */
  end: Date;
  canGoBack: boolean;
  canGoForward: boolean;
}

const MONTHS_PER_PERIOD: Record<Exclude<Period, "all">, number> = { "6m": 6, "12m": 12 };

function startOfMonth(date: Date, monthOffset = 0): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

/**
 * `offset` = cuántos periodos hacia atrás (0 = el actual, -1 = el anterior...).
 * Nunca va más allá del mes del primer dato ni del mes actual. "Todo" va del
 * primer dato a hoy.
 */
export function periodWindow(period: Period, offset: number, dataStart: Date, dataEnd: Date, now: Date): TimeWindow {
  const firstMonth = startOfMonth(dataStart);
  const currentEnd = startOfMonth(dataEnd > now ? dataEnd : now, 1);

  if (period === "all") {
    return { start: firstMonth, end: currentEnd, canGoBack: false, canGoForward: false };
  }

  const months = MONTHS_PER_PERIOD[period];
  const end = startOfMonth(currentEnd, offset * months);
  const start = startOfMonth(end, -months);
  return { start, end, canGoBack: start > firstMonth, canGoForward: offset < 0 };
}

/** Etiqueta de mes para un eje: abreviada, con el año en enero o en la primera etiqueta. */
export function monthLabel(timestamp: number, locale: string, forceYear: boolean): string {
  const date = new Date(timestamp);
  const month = date.toLocaleDateString(locale, { month: "short" }).replace(".", "");
  return date.getMonth() === 0 || forceYear ? `${month}\n${date.getFullYear()}` : month;
}

export function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export function formatMonthYear(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
}
