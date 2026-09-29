import type { IncomingMessage, ServerResponse } from "node:http";
import { getAppContext } from "../../../container.js";
import { readCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";

/**
 * RF-39 (nota "spec viva"): la cookie de sesión es httpOnly a propósito
 * (ADR-06) — el frontend no puede leerla, así que pregunta aquí. Incluye
 * `name` (RF-03) para que el Header pueda mostrarlo sin una llamada aparte
 * a /api/accounts/profile solo para pintar la cabecera — este endpoint ya
 * se llama en cada pantalla protegida (SessionContext).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession, getProfile } = getAppContext();
    const result = await verifySession(token);

    if (!result.ok) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ autenticado: false }));
      return;
    }

    // getProfile es un enriquecimiento, no el propósito de este endpoint —
    // un fallo ahí (tabla sin migrar, Supabase caído...) no debe convertir
    // una comprobación de sesión que sí funcionó en un 500. Mismo criterio
    // que en RegisterUser (ver su nota de diseño): se degrada a "sin
    // nombre todavía", nunca a "no sé si hay sesión".
    let name: string | undefined;
    try {
      const profile = await getProfile(result.value.id);
      name = profile.ok ? profile.value?.name : undefined;
    } catch (error) {
      logger.error("No se pudo obtener el perfil en /api/accounts/session (se ignora, no es crítico)", error, {
        route: "/api/accounts/session",
      });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ autenticado: true, email: result.value.email, name, rol: result.value.rol }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/session", error, { route: "/api/accounts/session" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
