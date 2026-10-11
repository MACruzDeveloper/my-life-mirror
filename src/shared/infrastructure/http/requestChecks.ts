import type { IncomingMessage } from "node:http";

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * ¿Viene la petición de otra web? Un navegador añade `Origin` a todo POST,
 * PATCH o DELETE; si no coincide con el dominio que sirve la app, es otra
 * página intentando actuar con la sesión de quien la visita (CSRF). La cookie
 * `SameSite=Lax` ya lo impide; esto es una segunda capa. Sin `Origin` no es un
 * navegador (un script, el smoke de producción), y ahí no hay sesión que robar.
 */
export function isCrossOrigin(req: IncomingMessage): boolean {
  const origin = header(req, "origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return true;
  }
  const hosts = [header(req, "x-forwarded-host"), header(req, "host")].filter(Boolean);
  return !hosts.includes(originHost);
}

/**
 * La IP de quien llama. En Vercel la pone la plataforma (`x-real-ip`, y la
 * primera de `x-forwarded-for`), sobrescribiendo lo que mande el cliente: no se
 * puede falsear desde fuera.
 */
export function clientIp(req: IncomingMessage): string {
  return header(req, "x-real-ip") ?? header(req, "x-forwarded-for")?.split(",")[0].trim() ?? req.socket?.remoteAddress ?? "desconocida";
}

/** Tamaño máximo del cuerpo de una petición, en caracteres de su JSON. Lo mayor que envía la app (una entrevista con sus notas) no llega a una décima parte. */
export const MAX_BODY_LENGTH = 32_000;

/** ¿Es el cuerpo desmesurado? Se corta antes de validarlo: nada legítimo ocupa tanto (SEC-03). */
export function isBodyTooLarge(body: unknown): boolean {
  return body !== undefined && body !== null && JSON.stringify(body).length > MAX_BODY_LENGTH;
}
