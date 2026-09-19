import type { IncomingMessage, ServerResponse } from "node:http";
import { obtenerAppContext } from "../../src/shared/infrastructure/container";
import { leerCookie } from "../../src/shared/infrastructure/cookies";
import { logger } from "../../src/shared/infrastructure/logger";

/**
 * Controlador HTTP — ADM-01. El rol sale de la sesión verificada en el
 * servidor (nunca del cliente) y `listUsers` lo vuelve a comprobar: 401 sin
 * sesión, 403 si no es admin. Solo lectura y sin datos de contenido de los
 * usuarios (evaluaciones, notas, categorías).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, listUsers } = obtenerAppContext();
    const sesion = await verificarSesion(token);

    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const resultado = await listUsers(sesion.value);
    if (!resultado.ok) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden", code: resultado.error.code }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resultado.value));
  } catch (error) {
    logger.error("Error inesperado en /api/admin/users", error, { ruta: "/api/admin/users" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
