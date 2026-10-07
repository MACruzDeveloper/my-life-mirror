import { z } from "zod";
import { clearedSessionCookie } from "#shared/infrastructure/cookies.js";
import { action, reply, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

const DeleteAccountSchema = z.object({ password: z.string() });

/**
 * Controlador HTTP — RF-05. Elimina la cuenta y todos sus datos tras
 * comprobar la contraseña. El id y el email salen de la sesión verificada en
 * el servidor; del cuerpo solo se lee la contraseña. Al terminar borra la
 * cookie de sesión. Una contraseña equivocada es 403, no 401: la sesión es
 * válida (un 401 podría hacer creer al cliente que caducó); el único
 * administrador, 409.
 */
export default sessionHandler({
  route: "/api/accounts/delete-account",
  POST: action({
    schema: DeleteAccountSchema,
    execute: async ({ context, user, body }) => {
      const result = await context.deleteAccount({ userId: user.id, email: user.email, password: body.password });
      return result.ok ? reply(200, { deleted: true }, { "Set-Cookie": clearedSessionCookie() }) : result;
    },
  }),
});
