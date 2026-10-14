import { createRouter } from "#shared/infrastructure/http/router.js";
import events from "#shared/infrastructure/http/handlers/agenda/events.js";
import trips from "#shared/infrastructure/http/handlers/agenda/trips.js";

/**
 * Función serverless de `/api/agenda/events` (RF-48) y `/api/agenda/trips` (RF-49, los viajes: son recuerdos de la persona, como sus eventos). Es la duodécima: el plan
 * Hobby no admite más, así que cualquier acción nueva de la agenda va aquí, y
 * una capacidad nueva tendría que compartir función con otra (ver createRouter).
 */
export default createRouter("/api/agenda/", { events, trips });
