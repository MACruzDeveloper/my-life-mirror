import { createRouter } from "../../src/shared/infrastructure/http/router.js";
import personalize from "../../src/shared/infrastructure/http/handlers/recommendations/personalize.js";

/**
 * Función serverless de `/api/recommendations/personalize` (RF-40); `/api/recommendations`
 * a secas sigue siendo `index.ts`. Ver createRouter sobre el límite de 12 funciones.
 */
export default createRouter("/api/recommendations/", { personalize });
