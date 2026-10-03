import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "#shared/infrastructure/container.js";
import { logger } from "#shared/infrastructure/logger.js";

type RequestWithBody = IncomingMessage & { body: unknown };

const Schema = z.object({ email: z.string() });

/** RF-38. La respuesta es intencionalmente idéntica exista o no el email — solo el formato se valida. */
export default async function handler(req: RequestWithBody, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const data = Schema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const { requestPasswordReset } = getAppContext();
    const result = await requestPasswordReset(data.data);

    if (!result.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ mensaje: "Si el email existe, recibirás un enlace de recuperación." }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/request-password-reset", error, {
      route: "/api/accounts/request-password-reset",
    });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
