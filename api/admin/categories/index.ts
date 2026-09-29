import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "../../../src/shared/infrastructure/container.js";
import { readCookie } from "../../../src/shared/infrastructure/cookies.js";
import { logger } from "../../../src/shared/infrastructure/logger.js";

// Un texto por idioma; el caso de uso comprueba que estén todos los soportados (RNF-10).
const AddSchema = z.object({
  translations: z.record(z.string(), z.object({ name: z.string(), description: z.string() })),
  isSensitiveData: z.boolean(),
});

function responder(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/**
 * Controlador HTTP — ADM-02. GET lista el catálogo, POST añade una categoría.
 * Solo admin: 401 sin sesión, 403 si el rol no basta (el rol sale de la
 * sesión verificada en el servidor y los casos de uso lo comprueban otra vez).
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      responder(res, 405, { error: "Método no permitido" });
      return;
    }

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession, listCatalog, addCatalogCategory } = getAppContext();
    const session = await verifySession(token);
    if (!session.ok) {
      responder(res, 401, { error: "No autenticado" });
      return;
    }

    if (req.method === "GET") {
      const result = await listCatalog(session.value);
      if (!result.ok) {
        responder(res, 403, { error: "Forbidden", code: result.error.code });
        return;
      }
      responder(res, 200, result.value);
      return;
    }

    const data = AddSchema.safeParse(req.body);
    if (!data.success) {
      responder(res, 400, { error: "Petición mal formada" });
      return;
    }

    const result = await addCatalogCategory(session.value, data.data as Parameters<typeof addCatalogCategory>[1]);
    if (!result.ok) {
      const status = result.error.code === "FORBIDDEN" ? 403 : result.error.code === "CONFLICT" ? 409 : 400;
      responder(res, status, { error: result.error.message, code: result.error.code });
      return;
    }
    responder(res, 201, result.value);
  } catch (error) {
    logger.error("Error inesperado en /api/admin/categories", error, { route: "/api/admin/categories" });
    responder(res, 500, { error: "Error interno del servidor" });
  }
}
