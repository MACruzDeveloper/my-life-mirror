import { ok } from "#shared/domain/Result.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

/**
 * GET /api/categories/translations — RNF-10. El texto de cada categoría del
 * catálogo en cada idioma (también las retiradas: el historial las nombra),
 * para que la interfaz nombre las categorías por su `catalogId`. Es el
 * catálogo común, no datos personales: basta con tener sesión.
 */
export default sessionHandler({
  route: "/api/categories/translations",
  GET: action({ execute: async ({ context }) => ok(await context.listCatalogLabels()) }),
});
