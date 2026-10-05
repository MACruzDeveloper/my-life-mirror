/** Respuesta no 2xx; conserva el estado para distinguir, p. ej., un 403 (sin permiso) de un fallo cualquiera. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, url: string) {
    super(`${url} respondió ${status}`);
    this.status = status;
  }
}

/**
 * GET que devuelve JSON y lanza `HttpError` si la respuesta no es 2xx (para que la caché lo trate como error).
 * `signal`: la que TanStack Query da a cada carga (`queryFn: ({ signal }) => …`); al cancelarla
 * (`cancelQueries`, desmontar…) el navegador aborta la petición en vez de solo ignorar su respuesta.
 */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, ...(signal ? [{ signal }] : []));
  if (!response.ok) {
    throw new HttpError(response.status, url);
  }
  return (await response.json()) as T;
}
