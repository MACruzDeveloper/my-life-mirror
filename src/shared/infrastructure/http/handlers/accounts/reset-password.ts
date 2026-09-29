import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "../../../container.js";
import { logger } from "../../../logger.js";

type RequestWithBody = IncomingMessage & { body: unknown };

const Schema = z.object({ token: z.string(), password: z.string() });

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

    const { resetPassword: restablecerPassword } = getAppContext();
    const result = await restablecerPassword(data.data);

    if (!result.ok) {
      const status = result.error.code === "AUTHENTICATION_ERROR" ? 401 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/reset-password", error, {
      route: "/api/accounts/reset-password",
    });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
