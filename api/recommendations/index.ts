import type { IncomingMessage, ServerResponse } from "node:http";
import { getAppContext } from "../../src/shared/infrastructure/container.js";
import { readCookie } from "../../src/shared/infrastructure/cookies.js";
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

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession, listRecommendations } = getAppContext();
    const session = await verifySession(token);
    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const result = await listRecommendations(session.value.id);
    if (!result.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.value));
  } catch (error) {
    logger.error("Error inesperado en /api/recommendations", error, { route: "/api/recommendations" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
