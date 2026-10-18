/**
 * Un día sin hora, como texto "AAAA-MM-DD" (lo que da un `input type="date"` y
 * lo que guarda una columna `date`). Se compara como texto: el orden alfabético
 * es el cronológico.
 */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** `true` si es un día que existe (no vale "2026-02-30"). */
export function isIsoDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** El día (UTC) de un instante, desplazado los días que se pidan. */
export function isoDayFrom(date: Date, offsetDays = 0): string {
  return new Date(date.getTime() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}
