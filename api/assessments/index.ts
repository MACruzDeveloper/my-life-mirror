import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../../src/shared/infrastructure/container.js";
import { leerCookie } from "../../src/shared/infrastructure/cookies.js";
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

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, recordAssessments, getLatestScores } = obtenerAppContext();
    const sesion = await verificarSesion(token);

    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    if (req.method === "GET") {
      const resultado = await getLatestScores(sesion.value.id);
      if (!resultado.ok) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: resultado.error.message }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(resultado.value));
      return;
    }

    const datos = RecordAssessmentsSchema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const resultado = await recordAssessments({ userId: sesion.value.id, entries: datos.data.entries });
    if (!resultado.ok) {
      const status = resultado.error.code === "NOT_FOUND" ? 404 : resultado.error.code === "CONFLICT" ? 409 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message, code: resultado.error.code }));
      return;
    }

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ recorded: resultado.value.length }));
  } catch (error) {
    logger.error("Error inesperado en /api/assessments", error, { ruta: "/api/assessments" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
