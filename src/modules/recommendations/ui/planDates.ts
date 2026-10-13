/** RF-47 / RF-48: días sin hora ("AAAA-MM-DD") en la zona horaria de quien mira la pantalla. */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** El día local de hoy, desplazado los días que se pidan. */
export function dayFromToday(offsetDays = 0, now: Date = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "20 de octubre" / "20 October": día y mes, y el año solo si no es el actual. */
export function formatDay(isoDay: string, language: string, now: Date = new Date()): string {
  const [year, month, day] = isoDay.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(language, { day: "numeric", month: "long", ...(year !== now.getFullYear() ? { year: "numeric" } : {}) });
}
