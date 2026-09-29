/** Respuesta no 2xx; conserva el estado para distinguir, p. ej., un 403 (sin permiso) de un fallo cualquiera. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, url: string) {
    super(`${url} respondió ${status}`);
    this.status = status;
  }
}

/** GET que devuelve JSON y lanza `HttpError` si la respuesta no es 2xx (para que la caché lo trate como error). */
export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpError(response.status, url);
  }
  return (await response.json()) as T;
}
