import { z } from "zod";
import { logger } from "#shared/infrastructure/logger.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

// Un texto por idioma; el caso de uso comprueba que estén todos los soportados (RNF-10).
const AddSchema = z.object({
  translations: z.record(z.string(), z.object({ name: z.string(), description: z.string() })),
  isSensitiveData: z.boolean(),
});

/**
 * Controlador HTTP — ADM-02. GET lista el catálogo, POST añade una categoría.
 * Solo admin: 401 sin sesión, 403 si el rol no basta (el rol sale de la
 * sesión verificada en el servidor y los casos de uso lo comprueban otra vez).
 */
export default sessionHandler({
  route: "/api/admin/categories",
  noStore: true,
  onDenied: (userId) => logger.warn("Acceso de administración denegado", { route: "/api/admin/categories", userId }),
  GET: action({ execute: ({ context, user }) => context.listCatalog(user) }),
  POST: action({ schema: AddSchema, status: 201, execute: ({ context, user, body }) => context.addCatalogCategory(user, body as Parameters<typeof context.addCatalogCategory>[1]) }),
});
