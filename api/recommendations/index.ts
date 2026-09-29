import type { IncomingMessage, ServerResponse } from "node:http";
import { obtenerAppContext } from "../../src/shared/infrastructure/container.js";
import { leerCookie } from "../../src/shared/infrastructure/cookies.js";
import { logger } from "../../src/shared/infrastructure/logger.js";

/**
 * Controlador HTTP — RF-18. Devuelve las recomendaciones visibles del usuario
 * de la sesión (abiertas, de categorías activas y con la puntuación aún por
 * debajo del umbral). El `userId` sale siempre de la cookie. Las acciones
 * sobre ellas (hecha/descartada/pospuesta, RF-19) irán en esta misma función.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, listRecommendations } = obtenerAppContext();
    const sesion = await verificarSesion(token);
    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const resultado = await listRecommendations(sesion.value.id);
    if (!resultado.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resultado.value));
  } catch (error) {
    logger.error("Error inesperado en /api/recommendations", error, { ruta: "/api/recommendations" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
