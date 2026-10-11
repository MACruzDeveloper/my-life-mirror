import { z } from "zod";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const DeactivateCategorySchema = z.object({
  categoryId: z.string().max(MAX_ID_LENGTH),
});

/** Controlador HTTP — RF-07. Desactivar nunca requiere consentimiento. */
export default sessionHandler({
  route: "/api/categories/deactivate",
  POST: action({ schema: DeactivateCategorySchema, execute: ({ context, user, body }) => context.deactivateCategory({ userId: user.id, categoryId: body.categoryId }) }),
});
