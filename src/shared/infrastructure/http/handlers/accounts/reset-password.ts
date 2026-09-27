import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../../../container.js";
import { logger } from "../../../logger.js";

type PeticionConCuerpo = IncomingMessage & { body: unknown };

const Schema = z.object({ token: z.string(), password: z.string() });

export default async function handler(req: PeticionConCuerpo, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const datos = Schema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const { restablecerPassword } = obtenerAppContext();
    const resultado = await restablecerPassword(datos.data);

    if (!resultado.ok) {
      const status = resultado.error.code === "AUTHENTICATION_ERROR" ? 401 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/reset-password", error, {
      ruta: "/api/accounts/reset-password",
    });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
