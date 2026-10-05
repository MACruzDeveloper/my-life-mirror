import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "#shared/infrastructure/container.js";
import { readCookie } from "#shared/infrastructure/cookies.js";
import { logger } from "#shared/infrastructure/logger.js";

const SuggestSchema = z.object({
  experienceId: z.string().min(1),
  locale: z.string().min(2).max(5),
});

/**
 * Controlador HTTP — RF-45: opciones de las listas cerradas que la IA propone a
 * partir de una experiencia del usuario. Nunca devuelve un error por la IA: en
 * ese caso el caso de uso responde "sin sugerencias".
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const { verifySession, suggestExperienceOptions } = getAppContext();
    const session = await verifySession(readCookie(req.headers.cookie, "sesion"));
    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const data = SuggestSchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const result = await suggestExperienceOptions({ userId: session.value.id, ...data.data });
    if (!result.ok) {
      res.writeHead(result.error.code === "NOT_FOUND" ? 404 : 400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.value));
  } catch (error) {
    logger.error("Error inesperado en /api/recommendations/suggest-options", error, { route: "/api/recommendations/suggest-options" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
