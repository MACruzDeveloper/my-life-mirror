import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "../../src/shared/infrastructure/container.js";
import { readCookie } from "../../src/shared/infrastructure/cookies.js";
import { logger } from "../../src/shared/infrastructure/logger.js";

const RecordAssessmentsSchema = z.object({
  entries: z.array(
    z.object({
      categoryId: z.string(),
      score: z.number(),
      note: z.string().optional(),
    }),
  ),
});

/**
 * Controlador HTTP — RF-10. POST registra una entrevista (lista de
 * puntuaciones, todo o nada — ver RecordAssessments); GET devuelve la última
 * puntuación de cada categoría activa (pantalla "Resultados"). El `userId`
 * sale siempre de la cookie, nunca del cuerpo. El historial completo llega
 * con el panel (RF-14).
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession, recordAssessments, getLatestScores } = getAppContext();
    const session = await verifySession(token);

    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    if (req.method === "GET") {
      const result = await getLatestScores(session.value.id);
      if (!result.ok) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: result.error.message }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.value));
      return;
    }

    const data = RecordAssessmentsSchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const result = await recordAssessments({ userId: session.value.id, entries: data.data.entries });
    if (!result.ok) {
      const status = result.error.code === "NOT_FOUND" ? 404 : result.error.code === "CONFLICT" ? 409 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message, code: result.error.code }));
      return;
    }

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ recorded: result.value.length }));
  } catch (error) {
    logger.error("Error inesperado en /api/assessments", error, { route: "/api/assessments" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
