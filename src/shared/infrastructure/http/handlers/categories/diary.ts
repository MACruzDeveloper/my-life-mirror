import { z } from "zod";
import { type Result, ok } from "#shared/domain/Result.js";
import type { Experience } from "#modules/assessments/domain/Experience.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const AddExperienceSchema = z.object({
  categoryId: z.string().min(1),
  text: z.string().max(2000),
});

/** RF-43: compartir (con el idioma en que se escribió) o dejar de compartir. */
const ShareSchema = z.discriminatedUnion("shared", [
  z.object({ id: z.string().min(1), shared: z.literal(true), locale: z.string().min(1) }),
  z.object({ id: z.string().min(1), shared: z.literal(false) }),
]);

/** Lo que ve su autor: si está compartida o retirada tras un reporte, sin los detalles internos. */
function toDto(experience: Experience) {
  return {
    id: experience.id,
    categoryId: experience.categoryId,
    text: experience.text,
    createdAt: experience.createdAt,
    shared: experience.sharedAt !== undefined,
    reported: experience.reportedAt !== undefined,
  };
}

const asDto = <E>(result: Result<Experience, E>): Result<ReturnType<typeof toDto>, E> => (result.ok ? ok(toDto(result.value)) : result);

/**
 * Controlador HTTP — RF-44, el diario de experiencias (`/api/categories/diary`):
 * GET lista las del usuario, POST añade una (sin puntuar), DELETE `?id=` borra
 * una suya y PATCH la comparte o deja de compartir (RF-43; si no se puede, 422
 * con el motivo). El usuario sale siempre de la sesión, nunca del cuerpo.
 */
export default sessionHandler({
  route: "/api/categories/diary",
  GET: action({
    execute: async ({ context, user }) => {
      const result = await context.listExperiences(user.id);
      return result.ok ? ok(result.value.map(toDto)) : result;
    },
  }),
  POST: action({ schema: AddExperienceSchema, status: 201, execute: async ({ context, user, body }) => asDto(await context.addExperience({ userId: user.id, ...body })) }),
  DELETE: action({
    execute: async ({ context, user, query }) => {
      const result = await context.deleteExperience({ userId: user.id, experienceId: query.get("id") ?? "" });
      return result.ok ? ok({ deleted: true }) : result;
    },
  }),
  PATCH: action({
    schema: ShareSchema,
    execute: async ({ context, user, body }) =>
      asDto(body.shared ? await context.shareExperience({ userId: user.id, experienceId: body.id, locale: body.locale }) : await context.unshareExperience({ userId: user.id, experienceId: body.id })),
  }),
});
