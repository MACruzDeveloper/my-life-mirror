import type { IncomingMessage, ServerResponse } from "node:http";
import { obtenerAppContext } from "../../../container.js";
import { leerCookie } from "../../../cookies.js";
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

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, exportUserData } = obtenerAppContext();
    const sesion = await verificarSesion(token);
    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const resultado = await exportUserData({ id: sesion.value.id, email: sesion.value.email });
    if (!resultado.ok) {
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
    res.end(JSON.stringify(resultado.value, null, 2));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/export-data", error, { ruta: "/api/accounts/export-data" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
