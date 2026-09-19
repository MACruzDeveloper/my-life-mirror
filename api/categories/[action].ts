import { createRouter } from "../../src/shared/infrastructure/http/router";
import activate from "../../src/shared/infrastructure/http/handlers/categories/activate";
import deactivate from "../../src/shared/infrastructure/http/handlers/categories/deactivate";

/**
 * Función serverless de `/api/categories/activate|deactivate` (`/api/categories`
 * a secas sigue siendo `index.ts`). Ver createRouter sobre el límite de 12 funciones.
 */
export default createRouter("/api/categories/", { activate, deactivate });
