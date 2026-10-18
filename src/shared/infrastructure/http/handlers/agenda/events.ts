import { z } from "zod";
import { ok } from "#shared/domain/Result.js";
import { MAX_EVENT_CATEGORIES, MAX_EVENT_TITLE_LENGTH } from "#modules/agenda/domain/UserEvent.js";
import { MAX_ID_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const AddEventSchema = z.object({
  title: z.string().min(1).max(MAX_EVENT_TITLE_LENGTH),
  /** Día "AAAA-MM-DD"; el caso de uso comprueba que exista y esté en rango. */
  day: z.string().max(10),
  categoryIds: z.array(z.string().min(1).max(MAX_ID_LENGTH)).max(MAX_EVENT_CATEGORIES).optional(),
});

/**
 * Controlador HTTP — RF-48, los eventos propios (`/api/agenda/events`): GET
 * lista los del usuario, POST añade uno y DELETE `?id=` borra uno suyo. El
 * usuario sale siempre de la sesión, nunca del cuerpo.
 */
export default sessionHandler({
  route: "/api/agenda/events",
  GET: action({ execute: ({ context, user }) => context.listEvents(user.id) }),
  POST: action({ schema: AddEventSchema, status: 201, execute: ({ context, user, body }) => context.addEvent({ userId: user.id, ...body }) }),
  DELETE: action({
    execute: async ({ context, user, query }) => {
      const result = await context.deleteEvent({ userId: user.id, eventId: query.get("id") ?? "" });
      return result.ok ? ok({ deleted: true }) : result;
    },
  }),
});
