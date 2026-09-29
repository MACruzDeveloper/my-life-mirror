import type { IncomingMessage, ServerResponse } from "node:http";
import { obtenerAppContext } from "../../../container.js";
import { leerCookie } from "../../../cookies.js";
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
    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, getProfile } = obtenerAppContext();
    const resultado = await verificarSesion(token);

    if (!resultado.ok) {
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
      const perfil = await getProfile(resultado.value.id);
      name = perfil.ok ? perfil.value?.name : undefined;
    } catch (error) {
      logger.error("No se pudo obtener el perfil en /api/accounts/session (se ignora, no es crítico)", error, {
        ruta: "/api/accounts/session",
      });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ autenticado: true, email: resultado.value.email, name, rol: resultado.value.rol }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/session", error, { ruta: "/api/accounts/session" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
