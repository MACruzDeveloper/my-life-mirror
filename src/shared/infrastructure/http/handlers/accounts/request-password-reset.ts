import { z } from "zod";
import { AUTH_LIMITS, MAX_EMAIL_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { publicHandler } from "#shared/infrastructure/http/publicHandler.js";
import { reply } from "#shared/infrastructure/http/sessionHandler.js";

const Schema = z.object({ email: z.string().max(MAX_EMAIL_LENGTH) });

/**
 * RF-38. La respuesta es intencionalmente idéntica exista o no el email — solo
 * el formato se valida. El tope por cuenta (SEC-02) evita además que se use
 * para llenar de correos el buzón de otra persona.
 */
export default publicHandler({
  route: "/api/accounts/request-password-reset",
  schema: Schema,
  limit: { name: "request-password-reset", ...AUTH_LIMITS.requestPasswordReset, identity: (body) => body.email },
  execute: async ({ context, body }) => {
    const result = await context.requestPasswordReset(body);
    if (!result.ok) return result;
    return reply(200, { mensaje: "Si el email existe, recibirás un enlace de recuperación." });
  },
});
