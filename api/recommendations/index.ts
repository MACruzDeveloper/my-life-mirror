import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

/**
 * Controlador HTTP — RF-18. Devuelve las recomendaciones visibles del usuario
 * de la sesión (abiertas, de categorías activas y con la puntuación aún por
 * debajo del umbral). Las acciones sobre ellas (hecha/descartada/pospuesta,
 * RF-19) irán en esta misma función.
 */
export default sessionHandler({
  route: "/api/recommendations",
  GET: action({ execute: ({ context, user }) => context.listRecommendations(user.id) }),
});
