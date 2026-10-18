import { createRouter } from "#shared/infrastructure/http/router.js";
import events from "#shared/infrastructure/http/handlers/agenda/events.js";
import milestones from "#shared/infrastructure/http/handlers/agenda/milestones.js";
import trips from "#shared/infrastructure/http/handlers/agenda/trips.js";

/**
 * Función serverless de `/api/agenda/events` (RF-48), `/api/agenda/trips` y `/api/agenda/milestones` (RF-49, los viajes y los hitos: son recuerdos de la persona, como sus eventos). Es la duodécima: el plan
 * Hobby no admite más, así que cualquier acción nueva de la agenda va aquí, y
 * una capacidad nueva tendría que compartir función con otra (ver createRouter).
 */
export default createRouter("/api/agenda/", { events, trips, milestones });
