import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
// Imports relativos, no alias — ver nota en container.ts / AGENTS.md.
import { getAppContext } from "#shared/infrastructure/container.js";
import { sessionCookie } from "#shared/infrastructure/cookies.js";
import { logger } from "#shared/infrastructure/logger.js";

// Las funciones Node de Vercel son handlers HTTP estándar; req.body ya llega
// parseado como JSON en tiempo de ejecución. Se tipa contra Node nativo en
// vez de instalar @vercel/node solo por los tipos — su cadena de
// dependencias trae vulnerabilidades (ajv/path-to-regexp/undici) que no
// compensan por unos tipos que Node ya cubre (mismo criterio de
// "comprobar la alternativa nativa" de 02_Principios_Diseño.md apartado 4).
type RequestWithBody = IncomingMessage & { body: unknown };

/**
 * Controlador HTTP — ADR-03 apartado 3.4. Solo recibe input, valida tipos básicos,
 * delega al caso de uso y traduce el Result a un código de estado. Cero
 * lógica de negocio aquí. `name` se guarda como perfil inicial dentro del
 * propio caso de uso (RegisterUser, RF-03) — no hay una segunda llamada.
 */
const RegisterSchema = z.object({
  email: z.string(),
  password: z.string(),
  name: z.string(),
});

export default async function handler(req: RequestWithBody, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const data = RegisterSchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const { registerUser, logIn } = getAppContext();
    const result = await registerUser(data.data);

    if (!result.ok) {
      const status = result.error.code === "CONFLICT" ? 409 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message }));
      return;
    }

    // Sesión iniciada al registrarse: el usuario ya dio email y contraseña,
    // pedírselos otra vez en /login es fricción sin ganancia de seguridad. Si
    // este paso fallara, la cuenta ya existe: se responde 201 sin cookie y el
    // frontend le ofrece iniciar sesión a mano.
    const session = await logIn({ email: data.data.email, password: data.data.password });
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session.ok) headers["Set-Cookie"] = sessionCookie(session.value.token);

    res.writeHead(201, headers);
    res.end(JSON.stringify({ id: result.value.id, email: result.value.email, sesionIniciada: session.ok }));
  } catch (error) {
    // Cualquier excepción inesperada (p. ej. variables de entorno de Supabase
    // ausentes en container.ts) debe seguir devolviendo JSON — si no, el
    // frontend recibe un cuerpo no-JSON y muestra un error genérico y
    // engañoso ("no se pudo contactar con el servidor").
    logger.error("Error inesperado en /api/accounts/register", error, { route: "/api/accounts/register" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
