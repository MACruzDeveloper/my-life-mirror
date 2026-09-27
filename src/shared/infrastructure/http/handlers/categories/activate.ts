import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../../../container.js";
import { leerCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";
import { VERSION_POLITICA_ACTUAL } from "../../../../../modules/consentimiento/domain/PoliticaActual.js";

const ActivateCategorySchema = z.object({
  categoryId: z.string(),
});

/**
 * Controlador HTTP — RF-07, extendido por RF-04 para categorías sensibles.
 * La versión de política la fija el servidor (`VERSION_POLITICA_ACTUAL`),
 * nunca el cliente — no es algo que el navegador deba poder decidir.
 * `CONSENT_REQUIRED` se traduce a 409: el estado del recurso (sin
 * consentimiento todavía) impide la operación hasta que se resuelva.
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, activateCategory } = obtenerAppContext();
    const sesion = await verificarSesion(token);

    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const datos = ActivateCategorySchema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const resultado = await activateCategory({
      userId: sesion.value.id,
      categoryId: datos.data.categoryId,
      policyVersion: VERSION_POLITICA_ACTUAL,
    });

    if (!resultado.ok) {
      const status = resultado.error.code === "NOT_FOUND" ? 404 : resultado.error.code === "CONSENT_REQUIRED" ? 409 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message, code: resultado.error.code }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resultado.value));
  } catch (error) {
    logger.error("Error inesperado en /api/categories/activate", error, { ruta: "/api/categories/activate" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
