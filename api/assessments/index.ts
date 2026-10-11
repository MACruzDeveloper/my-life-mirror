import { z } from "zod";
import { bestEffort } from "#shared/infrastructure/http/bestEffort.js";
import { logger } from "#shared/infrastructure/logger.js";
import { MAX_ID_LENGTH, MAX_LIST_LENGTH, MAX_TEXT_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, reply, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const RecordAssessmentsSchema = z.object({
  entries: z.array(
    z.object({
      categoryId: z.string().max(MAX_ID_LENGTH),
      score: z.number(),
      note: z.string().max(MAX_TEXT_LENGTH).optional(),
    }),
  // Una entrevista tiene, como mucho, una entrada por categoría. Toda lista de entrada lleva
  // tope: zod anota un error por cada elemento que no encaja, sin límite (CVE-2023-54404).
  ).max(MAX_LIST_LENGTH),
});

/**
 * Controlador HTTP — RF-10. POST registra una entrevista (lista de
 * puntuaciones, todo o nada — ver RecordAssessments); GET devuelve la última
 * puntuación de cada categoría activa (pantalla "Resultados"). PERF-01: el POST
 * responde también con las últimas puntuaciones y las recomendaciones abiertas.
 */
export default sessionHandler({
  route: "/api/assessments",
  GET: action({ execute: ({ context, user }) => context.getLatestScores(user.id) }),
  POST: action({
    schema: RecordAssessmentsSchema,
    execute: async ({ context, user, body }) => {
      const result = await context.recordAssessments({ userId: user.id, entries: body.entries });
      if (!result.ok) return result;

      // PERF-01: lo que cambia al guardar va en la respuesta (las mismas formas que GET /api/assessments
      // y GET /api/recommendations), así la pantalla no tiene que volver a pedirlo: de 4 llamadas a 2.
      // Ya está guardado: si releer falla, se responde igual (sin esos datos, el cliente los vuelve a pedir).
      const warn = (what: string) => (error: unknown) => logger.warn(`No se pudo releer ${what} tras guardar (el guardado es válido)`, { error: String(error) });
      const [latest, recommendations] = await Promise.all([
        bestEffort(() => context.getLatestScores(user.id), warn("las puntuaciones")),
        bestEffort(() => context.listRecommendations(user.id), warn("las recomendaciones")),
      ]);
      return reply(201, { recorded: result.value.length, ...(latest && { latest }), ...(recommendations && { recommendations }) });
    },
  }),
});
