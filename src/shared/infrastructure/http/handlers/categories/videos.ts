import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

/**
 * Controlador HTTP — RF-49 / ADM-04: los vídeos de inspiración de la página de
 * una categoría (`/api/categories/videos?category=&locale=`), en ese idioma o,
 * si no hay ninguno, en otro. Con sesión, como el resto de la página.
 */
export default sessionHandler({
  route: "/api/categories/videos",
  GET: action({ execute: ({ context, query }) => context.listInspirationVideos({ categoryKey: query.get("category") ?? "", locale: query.get("locale") ?? "" }) }),
});
