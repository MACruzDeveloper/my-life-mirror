import { z } from "zod";
import { ok } from "#shared/domain/Result.js";
import { GENDERS } from "#modules/accounts/domain/Profile.js";
import { MAX_ID_LENGTH, MAX_NAME_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const UpdateProfileSchema = z.object({
  name: z.string().max(MAX_NAME_LENGTH).optional(),
  birthDate: z.string().max(MAX_ID_LENGTH).optional(),
  gender: z.enum(GENDERS).optional(),
  timeZone: z.string().max(MAX_ID_LENGTH).optional(),
});

/**
 * Controlador HTTP — ADR-03 apartado 3.4 / RF-03. GET devuelve el perfil actual (o
 * `null` si aún no existe); POST actualiza (upsert parcial — solo los
 * campos indicados). Ambos exigen sesión activa — el `userId` sale siempre
 * de la sesión, nunca del cuerpo de la petición (evita que alguien edite el
 * perfil de otro usuario).
 */
export default sessionHandler({
  route: "/api/accounts/profile",
  GET: action({
    execute: async ({ context, user }) => {
      const result = await context.getProfile(user.id);
      return ok(result.ok ? (result.value ?? null) : null);
    },
  }),
  POST: action({ schema: UpdateProfileSchema, execute: ({ context, user, body }) => context.updateProfile({ userId: user.id, ...body }) }),
});
