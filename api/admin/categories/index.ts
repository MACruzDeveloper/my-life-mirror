import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../../../src/shared/infrastructure/container";
import { leerCookie } from "../../../src/shared/infrastructure/cookies";
import { logger } from "../../../src/shared/infrastructure/logger";

// Un texto por idioma; el caso de uso comprueba que estén todos los soportados (RNF-10).
const AddSchema = z.object({
  translations: z.record(z.string(), z.object({ name: z.string(), description: z.string() })),
  isSensitiveData: z.boolean(),
});

function responder(res: ServerResponse, status: number, cuerpo: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(cuerpo));
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

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, listCatalog, addCatalogCategory } = obtenerAppContext();
    const sesion = await verificarSesion(token);
    if (!sesion.ok) {
      responder(res, 401, { error: "No autenticado" });
      return;
    }

    if (req.method === "GET") {
      const resultado = await listCatalog(sesion.value);
      if (!resultado.ok) {
        responder(res, 403, { error: "Forbidden", code: resultado.error.code });
        return;
      }
      responder(res, 200, resultado.value);
      return;
    }

    const datos = AddSchema.safeParse(req.body);
    if (!datos.success) {
      responder(res, 400, { error: "Petición mal formada" });
      return;
    }

    const resultado = await addCatalogCategory(sesion.value, datos.data as Parameters<typeof addCatalogCategory>[1]);
    if (!resultado.ok) {
      const status = resultado.error.code === "FORBIDDEN" ? 403 : resultado.error.code === "CONFLICT" ? 409 : 400;
      responder(res, status, { error: resultado.error.message, code: resultado.error.code });
      return;
    }
    responder(res, 201, resultado.value);
  } catch (error) {
    logger.error("Error inesperado en /api/admin/categories", error, { ruta: "/api/admin/categories" });
    responder(res, 500, { error: "Error interno del servidor" });
  }
}
