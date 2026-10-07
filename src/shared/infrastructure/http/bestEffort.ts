import type { Result } from "#shared/domain/Result.js";

/**
 * Una lectura que acompaña a una respuesta pero no debe estropearla: si falla (error de negocio o
 * excepción), `undefined`. PERF-01: tras guardar una evaluación (inmutable, RF-12), un fallo al releer
 * puntuaciones o ideas no puede convertirse en un 500, o el usuario reintenta y la duplica; el cliente,
 * sin esos datos, los vuelve a pedir.
 */
export async function bestEffort<T>(read: () => Promise<Result<T, unknown>>, onError: (error: unknown) => void = () => {}): Promise<T | undefined> {
  try {
    const result = await read();
    return result.ok ? result.value : undefined;
  } catch (error) {
    onError(error);
    return undefined;
  }
}
