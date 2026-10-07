import { z } from "zod";
import { action, reply, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const AiSuggestionsSchema = z.object({ enabled: z.boolean() });

/** Controlador HTTP — RF-45: el usuario activa o desactiva las sugerencias de la IA a partir de sus experiencias (mismo proveedor que RF-40). */
export default sessionHandler({
  route: "/api/accounts/ai-suggestions",
  POST: action({
    schema: AiSuggestionsSchema,
    execute: async ({ context, user, body }) => {
      // Activar algo que no existe en este despliegue no tiene sentido; desactivar siempre se permite.
      if (body.enabled && !context.aiIdeasAvailable) return reply(409, { error: "Las sugerencias con IA no están disponibles" });
      return context.setAiSuggestions({ userId: user.id, enabled: body.enabled });
    },
  }),
});
