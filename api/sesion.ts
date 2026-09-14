import type { IncomingMessage, ServerResponse } from "node:http";
import { obtenerAppContext } from "../src/shared/infrastructure/container";
import { leerCookie } from "../src/shared/infrastructure/cookies";
import { logger } from "../src/shared/infrastructure/logger";

/**
 * RF-39 (nota "spec viva"): la cookie de sesión es httpOnly a propósito
 * (ADR-06) — el frontend no puede leerla, así que pregunta aquí.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion } = obtenerAppContext();
    const resultado = await verificarSesion(token);

    if (!resultado.ok) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ autenticado: false }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ autenticado: true, email: resultado.value.email }));
  } catch (error) {
    logger.error("Error inesperado en /api/sesion", error, { ruta: "/api/sesion" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
