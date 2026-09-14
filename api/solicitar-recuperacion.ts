import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../src/shared/infrastructure/container";
import { logger } from "../src/shared/infrastructure/logger";

type PeticionConCuerpo = IncomingMessage & { body: unknown };

const Schema = z.object({ email: z.string() });

/** RF-38. La respuesta es intencionalmente idéntica exista o no el email — solo el formato se valida. */
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

    const { solicitarRecuperacion } = obtenerAppContext();
    const resultado = await solicitarRecuperacion(datos.data);

    if (!resultado.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ mensaje: "Si el email existe, recibirás un enlace de recuperación." }));
  } catch (error) {
    logger.error("Error inesperado en /api/solicitar-recuperacion", error, {
      ruta: "/api/solicitar-recuperacion",
    });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
