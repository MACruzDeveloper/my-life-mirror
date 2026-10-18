import type { IncomingMessage, ServerResponse } from "node:http";
import { getAppContext } from "#shared/infrastructure/container.js";
import { REFRESH_COOKIE, SESSION_COOKIE, readCookie, sessionCookies } from "#shared/infrastructure/cookies.js";
import { logger } from "#shared/infrastructure/logger.js";

/**
 * RF-39 (nota "spec viva"): la cookie de sesión es httpOnly a propósito
 * (ADR-06) — el frontend no puede leerla, así que pregunta aquí. Incluye
 * `name` (RF-03) para que el Header pueda mostrarlo sin una llamada aparte
 * a /api/accounts/profile solo para pintar la cabecera — este endpoint ya
 * se llama en cada pantalla protegida (SessionContext).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const { resumeSession, getProfile, aiIdeasAvailable } = getAppContext();
    // SEC-05: si el token de acceso caducó, se renueva aquí también (es lo primero que pide cada pantalla protegida).
    const resumed = await resumeSession({ token: readCookie(req.headers.cookie, SESSION_COOKIE), refreshToken: readCookie(req.headers.cookie, REFRESH_COOKIE) });
    const result = resumed.ok ? { ok: true as const, value: resumed.value.user } : resumed;
    const renewed = resumed.ok && resumed.value.renewed ? { "Set-Cookie": sessionCookies(resumed.value.renewed) } : {};

    if (!result.ok) {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ autenticado: false }));
      return;
    }

    // getProfile es un enriquecimiento, no el propósito de este endpoint —
    // un fallo ahí (tabla sin migrar, Supabase caído...) no debe convertir
    // una comprobación de sesión que sí funcionó en un 500. Mismo criterio
    // que en RegisterUser (ver su nota de diseño): se degrada a "sin
    // nombre todavía", nunca a "no sé si hay sesión".
    let name: string | undefined;
    // RF-26: el avatar elegido, para la cabecera (misma lógica que el nombre: si falla, sin él).
    let avatarKey: string | undefined;
    try {
      const profile = await getProfile(result.value.id);
      name = profile.ok ? profile.value?.name : undefined;
      avatarKey = profile.ok ? profile.value?.avatarKey : undefined;
    } catch (error) {
      logger.error("No se pudo obtener el perfil en /api/accounts/session (se ignora, no es crítico)", error, {
        route: "/api/accounts/session",
      });
    }

    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store", ...renewed });
    res.end(JSON.stringify({ autenticado: true, email: result.value.email, name, avatarKey, rol: result.value.rol, aiIdeasAvailable }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/session", error, { route: "/api/accounts/session" });
    res.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
