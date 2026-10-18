/** Código de PostgreSQL para "ya existe una fila con esa clave única". */
const UNIQUE_VIOLATION = "23505";
const MAX_ATTEMPTS = 3;

/**
 * Repite una escritura "insertar si no existe" cuando choca con una fila que
 * otra petición acaba de crear. `ON CONFLICT … DO NOTHING` solo tolera el
 * duplicado en el índice que se le nombra: si la tabla tiene otro índice único
 * y dos peticiones insertan lo mismo a la vez, PostgreSQL puede rechazar una
 * por ese otro índice. Para entonces la otra ya ha terminado, así que al
 * repetir, sus filas se ven como duplicados normales y se ignoran.
 */
export async function retryOnUniqueViolation<T extends { error: { code?: string } | null }>(write: () => PromiseLike<T>): Promise<T> {
  let result = await write();
  for (let attempt = 1; attempt < MAX_ATTEMPTS && result.error?.code === UNIQUE_VIOLATION; attempt += 1) {
    result = await write();
  }
  return result;
}
