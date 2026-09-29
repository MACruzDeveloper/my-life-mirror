import type { IncomingMessage, ServerResponse } from "node:http";
import { getAppContext } from "../../../container.js";
import { readCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";

/**
 * GET /api/categories/translations — RNF-10. El texto de cada categoría del
 * catálogo en cada idioma (también las retiradas: el historial las nombra),
 * para que la interfaz nombre las categorías por su `catalogId`. Es el
 * catálogo común, no datos personales: basta con tener sesión.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const { verifySession, listCatalogLabels } = getAppContext();
    const session = await verifySession(readCookie(req.headers.cookie, "sesion"));
    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(await listCatalogLabels()));
  } catch (error) {
    logger.error("Error inesperado en /api/categories/translations", error, { route: "/api/categories/translations" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
