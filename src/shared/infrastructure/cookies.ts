/** Parseo mínimo de la cabecera Cookie — no hace falta una librería para esto. */
export function readCookie(header: string | undefined, cookieName: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === cookieName) return rest.join("=");
  }
  return undefined;
}

/** Cookie de sesión httpOnly (ADR-06) — un único sitio para login y registro, para que no diverjan. */
export function sessionCookie(token: string): string {
  return [`sesion=${token}`, "HttpOnly", "Secure", "SameSite=Lax", "Path=/", `Max-Age=${60 * 60}`].join("; ");
}

/** Borra la cookie de sesión (mismo formato que `cookieDeSesion`, con `Max-Age=0`). */
export function clearedSessionCookie(): string {
  return ["sesion=", "HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age=0"].join("; ");
}
