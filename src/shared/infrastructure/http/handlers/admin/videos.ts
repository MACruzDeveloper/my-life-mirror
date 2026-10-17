import { z } from "zod";
import { ok } from "#shared/domain/Result.js";
import { logger } from "#shared/infrastructure/logger.js";
import { MAX_ID_LENGTH, MAX_TEXT_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

// Límites holgados: el caso de uso recorta y comprueba los suyos (título 120).
const AddSchema = z.object({
  categoryKey: z.string().max(MAX_ID_LENGTH),
  locale: z.string().max(10),
  youtubeUrl: z.string().max(500),
  title: z.string().max(MAX_TEXT_LENGTH),
});
const UpdateSchema = AddSchema.extend({ id: z.string().max(MAX_ID_LENGTH) });

/**
 * Controlador HTTP — ADM-04, los vídeos de inspiración (`/api/admin/videos`):
 * GET lista todos, POST añade uno, PATCH edita uno y DELETE `?id=` quita uno. Solo admin: 401
 * sin sesión, 403 si el rol no basta (lo comprueba el caso de uso con el rol de
 * la sesión verificada), y el intento queda en el log.
 */
export default sessionHandler({
  route: "/api/admin/videos",
  onDenied: (userId) => logger.warn("Acceso de administración denegado", { route: "/api/admin/videos", userId }),
  GET: action({ execute: ({ context, user }) => context.listAllInspirationVideos(user) }),
  POST: action({ schema: AddSchema, status: 201, execute: ({ context, user, body }) => context.addInspirationVideo(user, body) }),
  PATCH: action({ schema: UpdateSchema, execute: ({ context, user, body: { id, ...fields } }) => context.updateInspirationVideo(user, id, fields) }),
  DELETE: action({
    execute: async ({ context, user, query }) => {
      const result = await context.deleteInspirationVideo(user, query.get("id") ?? "");
      return result.ok ? ok({ deleted: true }) : result;
    },
  }),
});
