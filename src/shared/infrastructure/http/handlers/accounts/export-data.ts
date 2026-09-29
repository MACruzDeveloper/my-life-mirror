import type { IncomingMessage, ServerResponse } from "node:http";
import { getAppContext } from "../../../container.js";
import { readCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";

/**
 * Controlador HTTP — RF-05/RNF-12. Devuelve un JSON descargable con todos los
 * datos del usuario de la sesión (nunca los de otro: el id sale de la cookie).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession: verificarSesion, exportUserData } = getAppContext();
    const session = await verificarSesion(token);
    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const result = await exportUserData({ id: session.value.id, email: session.value.email });
    if (!result.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No se pudieron exportar los datos" }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mylifemirror-mis-datos.json"',
      // Datos personales: que ninguna caché intermedia los guarde.
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(result.value, null, 2));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/export-data", error, { route: "/api/accounts/export-data" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
