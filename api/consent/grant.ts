import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "#shared/infrastructure/container.js";
import { readCookie } from "#shared/infrastructure/cookies.js";
import { logger } from "#shared/infrastructure/logger.js";
import { CURRENT_POLICY_VERSION } from "#modules/consent/domain/CurrentPolicy.js";

const GrantConsentSchema = z.object({
  categoryId: z.string(),
});

/**
 * Controlador HTTP — primer endpoint real de RF-04 (hasta ahora solo tenía
 * casos de uso). Se llama tras el modal de consentimiento, antes de
 * reintentar `activate-category`. La versión de política la fija el
 * servidor, igual que en activate-category.ts.
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession, grantConsent } = getAppContext();
    const session = await verifySession(token);

    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const data = GrantConsentSchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const result = await grantConsent({
      userId: session.value.id,
      categoryId: data.data.categoryId,
      policyVersion: CURRENT_POLICY_VERSION,
    });

    if (!result.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    logger.error("Error inesperado en /api/consent/grant", error, { route: "/api/consent/grant" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
