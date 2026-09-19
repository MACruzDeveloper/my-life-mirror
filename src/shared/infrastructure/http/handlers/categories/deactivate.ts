import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../../../container";
import { leerCookie } from "../../../cookies";
import { logger } from "../../../logger";

const DeactivateCategorySchema = z.object({
  categoryId: z.string(),
});

/** Controlador HTTP — RF-07. Desactivar nunca requiere consentimiento. */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, deactivateCategory } = obtenerAppContext();
    const sesion = await verificarSesion(token);

    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const datos = DeactivateCategorySchema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const resultado = await deactivateCategory({ userId: sesion.value.id, categoryId: datos.data.categoryId });
    if (!resultado.ok) {
      const status = resultado.error.code === "NOT_FOUND" ? 404 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resultado.value));
  } catch (error) {
    logger.error("Error inesperado en /api/categories/deactivate", error, { ruta: "/api/categories/deactivate" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
