import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
// Imports relativos, no alias — ver nota en container.ts / AGENTS.md.
import { getAppContext } from "../../../container.js";
import { readCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";

type RequestWithBody = IncomingMessage & { body: unknown };

const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["woman", "man", "non-binary", "prefer-not-to-say"]).optional(),
  timeZone: z.string().optional(),
});

/**
 * Controlador HTTP — ADR-03 apartado 3.4 / RF-03. GET devuelve el perfil actual (o
 * `null` si aún no existe); POST actualiza (upsert parcial — solo los
 * campos indicados). Ambos exigen sesión activa — el `userId` sale siempre
 * de la cookie, nunca del cuerpo de la petición (evita que alguien edite el
 * perfil de otro usuario).
 */
export default async function handler(req: RequestWithBody, res: ServerResponse) {
  try {
    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession: verificarSesion, updateProfile, getProfile } = getAppContext();
    const session = await verificarSesion(token);

    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    if (req.method === "GET") {
      const result = await getProfile(session.value.id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.ok ? (result.value ?? null) : null));
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const data = UpdateProfileSchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const result = await updateProfile({ userId: session.value.id, ...data.data });
    if (!result.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.value));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/profile", error, { route: "/api/accounts/profile" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
