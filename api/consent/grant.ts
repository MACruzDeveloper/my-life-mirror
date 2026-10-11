import { z } from "zod";
import { ok } from "#shared/domain/Result.js";
import { CURRENT_POLICY_VERSION } from "#modules/consent/domain/CurrentPolicy.js";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const GrantConsentSchema = z.object({
  categoryId: z.string().max(MAX_ID_LENGTH),
});

/**
 * Controlador HTTP — RF-04. Se llama tras el modal de consentimiento, antes de
 * reintentar la activación. La versión de política la fija el servidor, igual
 * que al activar una categoría.
 */
export default sessionHandler({
  route: "/api/consent/grant",
  POST: action({
    schema: GrantConsentSchema,
    execute: async ({ context, user, body }) => {
      const result = await context.grantConsent({ userId: user.id, categoryId: body.categoryId, policyVersion: CURRENT_POLICY_VERSION });
      return result.ok ? ok({ ok: true }) : result;
    },
  }),
});
