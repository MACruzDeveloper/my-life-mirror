import { z } from "zod";
import { AUTH_LIMITS, MAX_PASSWORD_INPUT_LENGTH, MAX_TOKEN_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { publicHandler } from "#shared/infrastructure/http/publicHandler.js";
import { reply } from "#shared/infrastructure/http/sessionHandler.js";

const Schema = z.object({ token: z.string().max(MAX_TOKEN_LENGTH), password: z.string().max(MAX_PASSWORD_INPUT_LENGTH) });

/** RF-38. La contraseña nueva pasa la misma política que la del registro (SEC-01). */
export default publicHandler({
  route: "/api/accounts/reset-password",
  schema: Schema,
  limit: { name: "reset-password", ...AUTH_LIMITS.resetPassword },
  execute: async ({ context, body }) => {
    const result = await context.resetPassword(body);
    // 401: el enlace de recuperación no vale o ha caducado.
    if (!result.ok && result.error.code === "AUTHENTICATION_ERROR") return reply(401, { error: result.error.message, code: result.error.code });
    return result;
  },
});
