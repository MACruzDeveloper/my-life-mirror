/** Parseo mínimo de la cabecera Cookie — no hace falta una librería para esto. */
export function leerCookie(header: string | undefined, nombre: string): string | undefined {
  if (!header) return undefined;
  for (const parte of header.split(";")) {
    const [clave, ...resto] = parte.trim().split("=");
    if (clave === nombre) return resto.join("=");
  }
  return undefined;
}

/** Cookie de sesión httpOnly (ADR-06) — un único sitio para login y registro, para que no diverjan. */
export function cookieDeSesion(token: string): string {
  return [`sesion=${token}`, "HttpOnly", "Secure", "SameSite=Lax", "Path=/", `Max-Age=${60 * 60}`].join("; ");
}
