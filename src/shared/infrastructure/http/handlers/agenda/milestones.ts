import { z } from "zod";
import { ok } from "#shared/domain/Result.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";
import { MAX_MILESTONE_TITLE_LENGTH, MILESTONE_CATEGORIES } from "#modules/agenda/domain/Milestone.js";

const AddMilestoneSchema = z.object({
  categoryKey: z.enum(MILESTONE_CATEGORIES),
  /** El caso de uso recorta espacios y comprueba la longitud de nuevo. */
  title: z.string().max(MAX_MILESTONE_TITLE_LENGTH + 20),
  year: z.number().int(),
  month: z.number().int().optional(),
});

/**
 * Controlador HTTP — RF-49, los hitos (`/api/agenda/milestones`): GET
 * `?category=` lista los de una página, POST añade uno y DELETE `?id=` borra
 * uno suyo. El usuario sale siempre de la sesión, nunca del cuerpo.
 */
export default sessionHandler({
  route: "/api/agenda/milestones",
  GET: action({ execute: ({ context, user, query }) => context.listMilestones({ userId: user.id, categoryKey: query.get("category") ?? "" }) }),
  POST: action({ schema: AddMilestoneSchema, status: 201, execute: ({ context, user, body }) => context.addMilestone({ userId: user.id, ...body }) }),
  DELETE: action({
    execute: async ({ context, user, query }) => {
      const result = await context.deleteMilestone({ userId: user.id, milestoneId: query.get("id") ?? "" });
      return result.ok ? ok({ deleted: true }) : result;
    },
  }),
});
