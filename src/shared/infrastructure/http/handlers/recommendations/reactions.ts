import { z } from "zod";
import { IDEA_REACTIONS } from "#modules/recommendations/domain/IdeaReaction.js";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const SetReactionSchema = z.object({
  categoryId: z.string().min(1).max(MAX_ID_LENGTH),
  templateKey: z.string().min(1).max(60),
  /** `null` quita la reacción. */
  reaction: z.enum(IDEA_REACTIONS).nullable(),
  /** RF-47: día "AAAA-MM-DD" para una idea guardada; `null` lo quita. El caso de uso comprueba que sea un día válido. */
  plannedFor: z.string().max(10).nullable().optional(),
});

/**
 * Controlador HTTP — RF-19. GET: lo que el usuario ha decidido sobre sus ideas
 * (guardada, hecha, descartada). POST: fija o quita la reacción a una idea,
 * y la fecha orientativa de una guardada (RF-47).
 * El usuario sale siempre de la sesión.
 */
export default sessionHandler({
  route: "/api/recommendations/reactions",
  GET: action({ execute: ({ context, user }) => context.listIdeaReactions(user.id) }),
  POST: action({ schema: SetReactionSchema, execute: ({ context, user, body }) => context.setIdeaReaction({ userId: user.id, ...body }) }),
});
