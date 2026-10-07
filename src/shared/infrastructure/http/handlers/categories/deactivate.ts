import { z } from "zod";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const DeactivateCategorySchema = z.object({
  categoryId: z.string(),
});

/** Controlador HTTP — RF-07. Desactivar nunca requiere consentimiento. */
export default sessionHandler({
  route: "/api/categories/deactivate",
  POST: action({ schema: DeactivateCategorySchema, execute: ({ context, user, body }) => context.deactivateCategory({ userId: user.id, categoryId: body.categoryId }) }),
});
