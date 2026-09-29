import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "../../../src/shared/infrastructure/container.js";
import { readCookie } from "../../../src/shared/infrastructure/cookies.js";
import { logger } from "../../../src/shared/infrastructure/logger.js";

const RetireSchema = z.object({ categoryId: z.string() });

function responder(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/** Controlador HTTP — ADM-02. Retira una categoría del catálogo (no la borra). Solo admin. */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      responder(res, 405, { error: "Método no permitido" });
      return;
    }

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession: verificarSesion, retireCatalogCategory } = getAppContext();
    const session = await verificarSesion(token);
    if (!session.ok) {
      responder(res, 401, { error: "No autenticado" });
      return;
    }

    const data = RetireSchema.safeParse(req.body);
    if (!data.success) {
      responder(res, 400, { error: "Petición mal formada" });
      return;
    }

    const result = await retireCatalogCategory(session.value, data.data.categoryId);
    if (!result.ok) {
      const status = result.error.code === "FORBIDDEN" ? 403 : result.error.code === "NOT_FOUND" ? 404 : 400;
      responder(res, status, { error: result.error.message, code: result.error.code });
      return;
    }
    responder(res, 200, { retired: true });
  } catch (error) {
    logger.error("Error inesperado en /api/admin/categories/retire", error, { route: "/api/admin/categories/retire" });
    responder(res, 500, { error: "Error interno del servidor" });
  }
}
