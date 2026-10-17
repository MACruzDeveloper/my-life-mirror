import { z } from "zod";
import { sessionCookies } from "#shared/infrastructure/cookies.js";
import { AUTH_LIMITS, MAX_EMAIL_LENGTH, MAX_NAME_LENGTH, MAX_PASSWORD_INPUT_LENGTH } from "#shared/infrastructure/http/authLimits.js";
import { publicHandler } from "#shared/infrastructure/http/publicHandler.js";
import { reply } from "#shared/infrastructure/http/sessionHandler.js";

const RegisterSchema = z.object({
  email: z.string().max(MAX_EMAIL_LENGTH),
  password: z.string().max(MAX_PASSWORD_INPUT_LENGTH),
  name: z.string().max(MAX_NAME_LENGTH),
});

/**
 * Controlador HTTP — ADR-03 apartado 3.4. Solo recibe input, valida tipos básicos,
 * delega al caso de uso y traduce el Result a un código de estado. Cero
 * lógica de negocio aquí. `name` se guarda como perfil inicial dentro del
 * propio caso de uso (RegisterUser, RF-03) — no hay una segunda llamada.
 *
 * Una contraseña débil se explica requisito a requisito (`WEAK_PASSWORD`,
 * SEC-01). Un email que ya tiene cuenta, en cambio, recibe un mensaje neutro:
 * no se afirma que la cuenta existe (ver la nota de límites de SEC-01).
 */
export default publicHandler({
  route: "/api/accounts/register",
  schema: RegisterSchema,
  limit: { name: "register", ...AUTH_LIMITS.register },
  execute: async ({ context, body }) => {
    const result = await context.registerUser(body);
    if (!result.ok) {
      if (result.error.code === "CONFLICT") return reply(400, { error: "No se ha podido crear la cuenta con este email", code: "EMAIL_NOT_ACCEPTED" });
      return result;
    }

    // Sesión iniciada al registrarse: el usuario ya dio email y contraseña,
    // pedírselos otra vez en /login es fricción sin ganancia de seguridad. Si
    // este paso fallara, la cuenta ya existe: se responde 201 sin cookie y el
    // frontend le ofrece iniciar sesión a mano.
    const session = await context.logIn({ email: body.email, password: body.password });
    return reply(201, { id: result.value.id, email: result.value.email, sesionIniciada: session.ok }, session.ok ? { "Set-Cookie": sessionCookies(session.value) } : {});
  },
});
