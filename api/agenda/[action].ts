import { createRouter } from "#shared/infrastructure/http/router.js";
import events from "#shared/infrastructure/http/handlers/agenda/events.js";

/**
 * Función serverless de `/api/agenda/events` (RF-48). Es la duodécima: el plan
 * Hobby no admite más, así que cualquier acción nueva de la agenda va aquí, y
 * una capacidad nueva tendría que compartir función con otra (ver createRouter).
 */
export default createRouter("/api/agenda/", { events });
