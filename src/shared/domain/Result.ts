/**
 * Patrón Result — ADR-03 §3.3.
 * Los casos de uso devuelven este tipo en vez de lanzar excepciones para
 * resultados de negocio esperables (validación fallida, no encontrado, conflicto),
 * obligando a quien llama a manejar explícitamente ambos casos.
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
