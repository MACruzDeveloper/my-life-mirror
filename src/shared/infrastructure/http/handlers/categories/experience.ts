import { z } from "zod";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const SetExperienceSchema = z.object({
  categoryId: z.string().max(MAX_ID_LENGTH),
  tags: z.array(z.string().max(60)).max(20),
});

/** Controlador HTTP — RF-41: sustituye las opciones de "¿Qué te ayuda?" de una categoría del usuario. */
export default sessionHandler({
  route: "/api/categories/experience",
  POST: action({ schema: SetExperienceSchema, execute: ({ context, user, body }) => context.setCategoryExperience({ userId: user.id, ...body }) }),
});
