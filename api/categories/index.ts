import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

/**
 * Controlador HTTP — RF-06. Devuelve la lista de categorías del usuario,
 * sembrando el catálogo estándar la primera vez (ver ListCategories).
 */
export default sessionHandler({
  route: "/api/categories",
  GET: action({ execute: ({ context, user }) => context.listCategories(user.id) }),
});
