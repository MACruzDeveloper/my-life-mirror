/**
 * SEC-05: rutas de la API cuyo 401 NO es una sesión caducada (credenciales
 * incorrectas o un enlace de recuperación no válido): tienen su propio mensaje.
 */
const NOT_A_SESSION = ["/api/accounts/login", "/api/accounts/register", "/api/accounts/request-password-reset", "/api/accounts/reset-password"];

function pathOf(input: RequestInfo | URL): string {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  return new URL(url, window.location.origin).pathname;
}

/**
 * SEC-05: vigila todas las llamadas a la API desde un solo sitio, sin tocar
 * cada pantalla. Si una responde 401 (el servidor ya intentó renovar la sesión
 * y no pudo), avisa con `onExpired`. Envuelve `fetch` mientras está montada la
 * zona protegida y lo deja como estaba al salir.
 */
export function watchSessionExpiry(onExpired: () => void): () => void {
  const original = window.fetch;
  window.fetch = async (input, init) => {
    const response = await original(input, init);
    const path = pathOf(input);
    if (response.status === 401 && path.startsWith("/api/") && !NOT_A_SESSION.includes(path)) onExpired();
    return response;
  };
  return () => {
    window.fetch = original;
  };
}
