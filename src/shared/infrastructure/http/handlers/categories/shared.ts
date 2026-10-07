import { z } from "zod";
import { ok } from "#shared/domain/Result.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const ReportSchema = z.object({ id: z.string().min(1) });

/**
 * Controlador HTTP — RF-43, lo que comparten otras personas (`/api/categories/shared`):
 * GET `?categoryId=&locale=` lista las de la misma categoría del catálogo (solo
 * id y texto) y POST `{ id }` reporta una, que deja de verse al momento.
 */
export default sessionHandler({
  route: "/api/categories/shared",
  GET: action({
    execute: ({ context, user, query }) => context.listSharedExperiences({ userId: user.id, categoryId: query.get("categoryId") ?? "", locale: query.get("locale") ?? "" }),
  }),
  POST: action({
    schema: ReportSchema,
    execute: async ({ context, user, body }) => {
      const result = await context.reportSharedExperience({ userId: user.id, experienceId: body.id });
      return result.ok ? ok({ reported: true }) : result;
    },
  }),
});
