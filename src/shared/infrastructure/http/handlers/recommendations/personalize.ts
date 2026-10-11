import { z } from "zod";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const PersonalizeSchema = z.object({
  recommendationId: z.string().min(1).max(MAX_ID_LENGTH),
  /** La idea del carrusel que se está viendo (UX-05); sin ella, la de la recomendación. */
  templateKey: z.string().min(1).max(60).optional(),
  locale: z.string().min(2).max(5),
});

/**
 * Controlador HTTP — RF-40: la idea de una recomendación, personalizada si
 * procede o la plantilla curada si no. Nunca devuelve un error por la IA:
 * en ese caso el caso de uso ya cae al texto curado.
 */
export default sessionHandler({
  route: "/api/recommendations/personalize",
  POST: action({ schema: PersonalizeSchema, execute: ({ context, user, body }) => context.personalizeRecommendation({ userId: user.id, ...body }) }),
});
