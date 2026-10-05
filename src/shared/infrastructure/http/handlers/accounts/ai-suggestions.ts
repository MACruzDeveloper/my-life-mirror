import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "#shared/infrastructure/container.js";
import { readCookie } from "#shared/infrastructure/cookies.js";
import { logger } from "#shared/infrastructure/logger.js";

const AiSuggestionsSchema = z.object({ enabled: z.boolean() });

/** Controlador HTTP — RF-45: el usuario activa o desactiva las sugerencias de la IA a partir de sus experiencias (mismo proveedor que RF-40). */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const { verifySession, setAiSuggestions, aiIdeasAvailable } = getAppContext();
    const session = await verifySession(readCookie(req.headers.cookie, "sesion"));
    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const data = AiSuggestionsSchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }
    // Activar algo que no existe en este despliegue no tiene sentido; desactivar siempre se permite.
    if (data.data.enabled && !aiIdeasAvailable) {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Las sugerencias con IA no están disponibles" }));
      return;
    }

    const result = await setAiSuggestions({ userId: session.value.id, enabled: data.data.enabled });
    if (!result.ok) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.value));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/ai-suggestions", error, { route: "/api/accounts/ai-suggestions" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
