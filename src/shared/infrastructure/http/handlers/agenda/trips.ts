import { z } from "zod";
import { ok } from "#shared/domain/Result.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const AddTripSchema = z.object({
  /** ISO de dos letras; el caso de uso comprueba que esté en la lista cerrada. */
  countryCode: z.string().max(2),
  year: z.number().int(),
  month: z.number().int().optional(),
});

/**
 * Controlador HTTP — RF-49, los viajes (`/api/agenda/trips`): GET lista los
 * del usuario, POST añade uno y DELETE `?id=` borra uno suyo. El usuario sale
 * siempre de la sesión, nunca del cuerpo.
 */
export default sessionHandler({
  route: "/api/agenda/trips",
  GET: action({ execute: ({ context, user }) => context.listTrips(user.id) }),
  POST: action({ schema: AddTripSchema, status: 201, execute: ({ context, user, body }) => context.addTrip({ userId: user.id, ...body }) }),
  DELETE: action({
    execute: async ({ context, user, query }) => {
      const result = await context.deleteTrip({ userId: user.id, tripId: query.get("id") ?? "" });
      return result.ok ? ok({ deleted: true }) : result;
    },
  }),
});
