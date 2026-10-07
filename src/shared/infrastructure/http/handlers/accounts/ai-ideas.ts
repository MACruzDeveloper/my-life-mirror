import { z } from "zod";
import { action, reply, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const AiIdeasSchema = z.object({ enabled: z.boolean() });

/** Controlador HTTP — RF-40: el usuario activa o desactiva las ideas personalizadas con IA. */
export default sessionHandler({
  route: "/api/accounts/ai-ideas",
  POST: action({
    schema: AiIdeasSchema,
    execute: async ({ context, user, body }) => {
      // Activar algo que no existe en este despliegue no tiene sentido; desactivar siempre se permite.
      if (body.enabled && !context.aiIdeasAvailable) return reply(409, { error: "Las ideas con IA no están disponibles" });
      return context.setAiIdeas({ userId: user.id, enabled: body.enabled });
    },
  }),
});
