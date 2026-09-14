/** Parseo mínimo de la cabecera Cookie — no hace falta una librería para esto. */
export function leerCookie(header: string | undefined, nombre: string): string | undefined {
  if (!header) return undefined;
  for (const parte of header.split(";")) {
    const [clave, ...resto] = parte.trim().split("=");
    if (clave === nombre) return resto.join("=");
  }
  return undefined;
}
