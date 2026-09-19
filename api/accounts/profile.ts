import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
// Imports relativos, no alias — ver nota en container.ts / AGENTS.md.
import { obtenerAppContext } from "../../src/shared/infrastructure/container";
import { leerCookie } from "../../src/shared/infrastructure/cookies";
import { logger } from "../../src/shared/infrastructure/logger";

type PeticionConCuerpo = IncomingMessage & { body: unknown };

const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["woman", "man", "non-binary", "prefer-not-to-say"]).optional(),
  timeZone: z.string().optional(),
});

/**
 * Controlador HTTP — ADR-03 §3.4 / RF-03. GET devuelve el perfil actual (o
 * `null` si aún no existe); POST actualiza (upsert parcial — solo los
 * campos indicados). Ambos exigen sesión activa — el `userId` sale siempre
 * de la cookie, nunca del cuerpo de la petición (evita que alguien edite el
 * perfil de otro usuario).
 */
export default async function handler(req: PeticionConCuerpo, res: ServerResponse) {
  try {
    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, updateProfile, getProfile } = obtenerAppContext();
    const sesion = await verificarSesion(token);

    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    if (req.method === "GET") {
      const resultado = await getProfile(sesion.value.id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(resultado.ok ? (resultado.value ?? null) : null));
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const datos = UpdateProfileSchema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const resultado = await updateProfile({ userId: sesion.value.id, ...datos.data });
    if (!resultado.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resultado.value));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/profile", error, { ruta: "/api/accounts/profile" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
