import { createRouter } from "#shared/infrastructure/http/router.js";
import personalize from "#shared/infrastructure/http/handlers/recommendations/personalize.js";
import reactions from "#shared/infrastructure/http/handlers/recommendations/reactions.js";
import suggestOptions from "#shared/infrastructure/http/handlers/recommendations/suggest-options.js";

/**
 * Función serverless de `/api/recommendations/personalize` (RF-40), `/reactions` (RF-19) y `/suggest-options` (RF-45); `/api/recommendations`
 * a secas sigue siendo `index.ts`. Ver createRouter sobre el límite de 12 funciones.
 */
export default createRouter("/api/recommendations/", { personalize, reactions, "suggest-options": suggestOptions });
