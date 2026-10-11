import { z } from "zod";
import { ok } from "#shared/domain/Result.js";
import { logger } from "#shared/infrastructure/logger.js";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const RetireSchema = z.object({ categoryId: z.string().max(MAX_ID_LENGTH) });

/** Controlador HTTP — ADM-02. Retira una categoría del catálogo (no la borra). Solo admin. */
export default sessionHandler({
  route: "/api/admin/categories/retire",
  onDenied: (userId) => logger.warn("Acceso de administración denegado", { route: "/api/admin/categories/retire", userId }),
  POST: action({
    schema: RetireSchema,
    execute: async ({ context, user, body }) => {
      const result = await context.retireCatalogCategory(user, body.categoryId);
      return result.ok ? ok({ retired: true }) : result;
    },
  }),
});
