import { z } from "zod";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const SetDifficultiesSchema = z.object({
  categoryId: z.string().max(MAX_ID_LENGTH),
  tags: z.array(z.string().max(60)).max(20),
});

/** Controlador HTTP — RF-42: sustituye las situaciones que le ponen difícil una categoría al usuario. */
export default sessionHandler({
  route: "/api/categories/difficulties",
  POST: action({ schema: SetDifficultiesSchema, execute: ({ context, user, body }) => context.setCategoryDifficulties({ userId: user.id, ...body }) }),
});
