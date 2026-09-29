import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "../../../container.js";
import { readCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";
import { CURRENT_POLICY_VERSION } from "../../../../../modules/consent/domain/CurrentPolicy.js";

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

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession, activateCategory } = getAppContext();
    const session = await verifySession(token);

    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const data = ActivateCategorySchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const result = await activateCategory({
      userId: session.value.id,
      categoryId: data.data.categoryId,
      policyVersion: CURRENT_POLICY_VERSION,
    });

    if (!result.ok) {
      const status = result.error.code === "NOT_FOUND" ? 404 : result.error.code === "CONSENT_REQUIRED" ? 409 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message, code: result.error.code }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.value));
  } catch (error) {
    logger.error("Error inesperado en /api/categories/activate", error, { route: "/api/categories/activate" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
