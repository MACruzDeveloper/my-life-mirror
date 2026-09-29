import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../../../src/shared/infrastructure/container.js";
import { leerCookie } from "../../../src/shared/infrastructure/cookies.js";
import { logger } from "../../../src/shared/infrastructure/logger.js";

const RetireSchema = z.object({ categoryId: z.string() });

function responder(res: ServerResponse, status: number, cuerpo: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(cuerpo));
}

/** Controlador HTTP — ADM-02. Retira una categoría del catálogo (no la borra). Solo admin. */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      responder(res, 405, { error: "Método no permitido" });
      return;
    }

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, retireCatalogCategory } = obtenerAppContext();
    const sesion = await verificarSesion(token);
    if (!sesion.ok) {
      responder(res, 401, { error: "No autenticado" });
      return;
    }

    const datos = RetireSchema.safeParse(req.body);
    if (!datos.success) {
      responder(res, 400, { error: "Petición mal formada" });
      return;
    }

    const resultado = await retireCatalogCategory(sesion.value, datos.data.categoryId);
    if (!resultado.ok) {
      const status = resultado.error.code === "FORBIDDEN" ? 403 : resultado.error.code === "NOT_FOUND" ? 404 : 400;
      responder(res, status, { error: resultado.error.message, code: resultado.error.code });
      return;
    }
    responder(res, 200, { retired: true });
  } catch (error) {
    logger.error("Error inesperado en /api/admin/categories/retire", error, { ruta: "/api/admin/categories/retire" });
    responder(res, 500, { error: "Error interno del servidor" });
  }
}
