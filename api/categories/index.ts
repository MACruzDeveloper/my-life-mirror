import type { IncomingMessage, ServerResponse } from "node:http";
import { getAppContext } from "../../src/shared/infrastructure/container.js";
import { readCookie } from "../../src/shared/infrastructure/cookies.js";
import { logger } from "../../src/shared/infrastructure/logger.js";

/**
 * Controlador HTTP — RF-06. Devuelve la lista de categorías del usuario,
 * sembrando el catálogo estándar la primera vez (ver ListCategories).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession: verificarSesion, listCategories } = getAppContext();
    const session = await verificarSesion(token);

    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const result = await listCategories(session.value.id);
    if (!result.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.value));
  } catch (error) {
    logger.error("Error inesperado en /api/categories", error, { route: "/api/categories" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
