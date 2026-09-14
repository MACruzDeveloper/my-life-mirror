import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
// Imports relativos, no alias — ver nota en container.ts / AGENTS.md.
import { obtenerAppContext } from "../src/shared/infrastructure/container";
import { logger } from "../src/shared/infrastructure/logger";

type PeticionConCuerpo = IncomingMessage & { body: unknown };

const LoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

/**
 * Controlador HTTP — ADR-03 §3.4 / ADR-06. El token que emite Supabase se
 * guarda en una cookie httpOnly puesta aquí — nunca se devuelve en el
 * cuerpo de la respuesta ni se maneja en el cliente.
 */
export default async function handler(req: PeticionConCuerpo, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const datos = LoginSchema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const { iniciarSesion } = obtenerAppContext();
    const resultado = await iniciarSesion(datos.data);

    if (!resultado.ok) {
      const status = resultado.error.code === "AUTHENTICATION_ERROR" ? 401 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message }));
      return;
    }

    const cookie = [
      `sesion=${resultado.value.token}`,
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Path=/",
      `Max-Age=${60 * 60}`,
    ].join("; ");

    res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": cookie });
    res.end(JSON.stringify({ id: resultado.value.id, email: resultado.value.email }));
  } catch (error) {
    logger.error("Error inesperado en /api/usuarios/login", error, { ruta: "/api/usuarios/login" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
