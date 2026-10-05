import { createRouter } from "#shared/infrastructure/http/router.js";
import activate from "#shared/infrastructure/http/handlers/categories/activate.js";
import deactivate from "#shared/infrastructure/http/handlers/categories/deactivate.js";
import experience from "#shared/infrastructure/http/handlers/categories/experience.js";
import translations from "#shared/infrastructure/http/handlers/categories/translations.js";

/**
 * Función serverless de `/api/categories/activate|deactivate|experience|translations`
 * (`/api/categories` a secas sigue siendo `index.ts`). Ver createRouter sobre
 * el límite de 12 funciones.
 */
export default createRouter("/api/categories/", { activate, deactivate, experience, translations });
