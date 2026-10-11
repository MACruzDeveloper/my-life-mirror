/**
 * RF-40b: tope diario de usos de IA por usuario, para que nadie pueda gastar el
 * crédito del proveedor a base de clics (la cuenta de prueba es pública). Un uso
 * = una idea personalizada o una sugerencia que llega a pedirse al proveedor.
 * Puerto — ADR-03 apartado 3.3.
 */
export interface AiUsageLimiter {
  /** Cuenta un uso de hoy para ese usuario si le quedan; `false` si ya agotó el tope (y no cuenta nada). */
  tryConsume(userId: string): Promise<boolean>;
}

/** Usos al día por usuario si `AI_DAILY_LIMIT` falta o no es válido. */
export const DEFAULT_AI_DAILY_LIMIT = 40;

export function parseAiDailyLimit(value: string | undefined): number {
  const text = value?.trim() ?? "";
  if (!/^\d+$/.test(text)) return DEFAULT_AI_DAILY_LIMIT;
  return Number(text);
}
