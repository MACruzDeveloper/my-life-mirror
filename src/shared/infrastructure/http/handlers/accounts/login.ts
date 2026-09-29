import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
// Imports relativos, no alias — ver nota en container.ts / AGENTS.md.
import { getAppContext } from "../../../container.js";
import { sessionCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";

type RequestWithBody = IncomingMessage & { body: unknown };

const LoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

/**
 * Controlador HTTP — ADR-03 apartado 3.4 / ADR-06. El token que emite Supabase se
 * guarda en una cookie httpOnly puesta aquí — nunca se devuelve en el
 * cuerpo de la respuesta ni se maneja en el cliente.
 */
export default async function handler(req: RequestWithBody, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const data = LoginSchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const { logIn: iniciarSesion } = getAppContext();
    const result = await iniciarSesion(data.data);

    if (!result.ok) {
      const status = result.error.code === "AUTHENTICATION_ERROR" ? 401 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": sessionCookie(result.value.token) });
    res.end(JSON.stringify({ id: result.value.id, email: result.value.email }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/login", error, { route: "/api/accounts/login" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
