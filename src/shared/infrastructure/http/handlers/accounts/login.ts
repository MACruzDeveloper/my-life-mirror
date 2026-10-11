import { z } from "zod";
import { sessionCookie } from "#shared/infrastructure/cookies.js";
import { AUTH_LIMITS, MAX_EMAIL_LENGTH, MAX_PASSWORD_INPUT_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { publicHandler } from "#shared/infrastructure/http/publicHandler.js";
import { reply } from "#shared/infrastructure/http/sessionHandler.js";

const LoginSchema = z.object({
  email: z.string().max(MAX_EMAIL_LENGTH),
  password: z.string().max(MAX_PASSWORD_INPUT_LENGTH),
});

/**
 * Controlador HTTP — ADR-03 apartado 3.4 / ADR-06. El token que emite Supabase se
 * guarda en una cookie httpOnly puesta aquí — nunca se devuelve en el
 * cuerpo de la respuesta ni se maneja en el cliente.
 *
 * Aquí no se da ninguna pista (SEC-01): email desconocido, contraseña
 * equivocada o contraseña que no cumpliría la política reciben el mismo 401
 * con el mismo mensaje. Y los intentos están contados (SEC-02).
 */
export default publicHandler({
  route: "/api/accounts/login",
  schema: LoginSchema,
  limit: { name: "login", ...AUTH_LIMITS.login, identity: (body) => body.email },
  execute: async ({ context, body }) => {
    const result = await context.logIn(body);
    if (!result.ok) return reply(401, { error: "Email o contraseña incorrectos" });
    return reply(200, { id: result.value.id, email: result.value.email }, { "Set-Cookie": sessionCookie(result.value.token) });
  },
});
