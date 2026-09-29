import type { IncomingMessage, ServerResponse } from "node:http";
import { getAppContext } from "../../src/shared/infrastructure/container.js";
import { readCookie } from "../../src/shared/infrastructure/cookies.js";
import { logger } from "../../src/shared/infrastructure/logger.js";

/** Controlador HTTP — RF-10. Historial de guardados del propio usuario (el `userId` sale de la cookie). */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession: verificarSesion, getAssessmentHistory } = getAppContext();
    const session = await verificarSesion(token);

    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const result = await getAssessmentHistory(session.value.id);
    if (!result.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.value));
  } catch (error) {
    logger.error("Error inesperado en /api/assessments/history", error, { route: "/api/assessments/history" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
