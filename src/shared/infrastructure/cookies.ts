/** Parseo mínimo de la cabecera Cookie — no hace falta una librería para esto. */
export function readCookie(header: string | undefined, cookieName: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === cookieName) return rest.join("=");
  }
  return undefined;
}

/** SEC-05: el token de acceso (una hora, lo que dura en Supabase) y el de renovación (dos días, decisión del autor). */
export const SESSION_COOKIE = "sesion";
export const REFRESH_COOKIE = "sesion_renovar";
const ACCESS_MAX_AGE = 60 * 60;
const REFRESH_MAX_AGE = 2 * 24 * 60 * 60;

function cookie(name: string, value: string, path: string, maxAge: number): string {
  return [`${name}=${value}`, "HttpOnly", "Secure", "SameSite=Lax", `Path=${path}`, `Max-Age=${maxAge}`].join("; ");
}

/**
 * Las dos cookies de sesión (ADR-06, SEC-05), httpOnly: el código del navegador nunca ve los tokens.
 * Un único sitio para inicio de sesión, registro y renovación, para que no diverjan. La de renovación
 * solo viaja a `/api`. Cada renovación vuelve a contar los dos días: la contraseña se pide tras dos
 * días sin usar la app.
 */
export function sessionCookies({ token, refreshToken }: { token: string; refreshToken: string }): string[] {
  return [cookie(SESSION_COOKIE, token, "/", ACCESS_MAX_AGE), cookie(REFRESH_COOKIE, refreshToken, "/api", REFRESH_MAX_AGE)];
}

/** Borra las dos (cerrar sesión, borrar la cuenta, sesión no válida): mismas rutas, `Max-Age=0`. */
export function clearedSessionCookies(): string[] {
  return [cookie(SESSION_COOKIE, "", "/", 0), cookie(REFRESH_COOKIE, "", "/api", 0)];
}
