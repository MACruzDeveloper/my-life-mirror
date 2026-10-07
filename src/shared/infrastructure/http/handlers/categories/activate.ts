import { z } from "zod";
import { CURRENT_POLICY_VERSION } from "#modules/consent/domain/CurrentPolicy.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const ActivateCategorySchema = z.object({
  categoryId: z.string(),
});

/**
 * Controlador HTTP — RF-07, extendido por RF-04 para categorías sensibles.
 * La versión de política la fija el servidor (`CURRENT_POLICY_VERSION`),
 * nunca el cliente — no es algo que el navegador deba poder decidir.
 * `CONSENT_REQUIRED` se traduce a 409 (con su `code`, que el cliente usa para
 * abrir el consentimiento): el estado del recurso impide la operación hasta que se resuelva.
 */
export default sessionHandler({
  route: "/api/categories/activate",
  POST: action({
    schema: ActivateCategorySchema,
    execute: ({ context, user, body }) => context.activateCategory({ userId: user.id, categoryId: body.categoryId, policyVersion: CURRENT_POLICY_VERSION }),
  }),
});
