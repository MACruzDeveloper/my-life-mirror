import { z } from "zod";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const SuggestSchema = z.object({
  experienceId: z.string().min(1).max(MAX_ID_LENGTH),
  locale: z.string().min(2).max(5),
});

/**
 * Controlador HTTP — RF-45: opciones de las listas cerradas que la IA propone a
 * partir de una experiencia del usuario. Nunca devuelve un error por la IA: en
 * ese caso el caso de uso responde "sin sugerencias".
 */
export default sessionHandler({
  route: "/api/recommendations/suggest-options",
  POST: action({ schema: SuggestSchema, execute: ({ context, user, body }) => context.suggestExperienceOptions({ userId: user.id, ...body }) }),
});
