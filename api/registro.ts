import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
// Imports relativos, no alias — ver nota en container.ts / AGENTS.md.
import { obtenerAppContext } from "../src/shared/infrastructure/container";
import { logger } from "../src/shared/infrastructure/logger";

// Las funciones Node de Vercel son handlers HTTP estándar; req.body ya llega
// parseado como JSON en tiempo de ejecución. Se tipa contra Node nativo en
// vez de instalar @vercel/node solo por los tipos — su cadena de
// dependencias trae vulnerabilidades (ajv/path-to-regexp/undici) que no
// compensan por unos tipos que Node ya cubre (mismo criterio de
// "comprobar la alternativa nativa" de 02_Principios_Diseño.md §4).
type PeticionConCuerpo = IncomingMessage & { body: unknown };

/**
 * Controlador HTTP — ADR-03 §3.4. Solo recibe input, valida tipos básicos,
 * delega al caso de uso y traduce el Result a un código de estado. Cero
 * lógica de negocio aquí.
 */
const RegistroSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export default async function handler(req: PeticionConCuerpo, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const datos = RegistroSchema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const { registrarUsuario } = obtenerAppContext();
    const resultado = await registrarUsuario(datos.data);

    if (!resultado.ok) {
      const status = resultado.error.code === "CONFLICT" ? 409 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message }));
      return;
    }

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id: resultado.value.id, email: resultado.value.email }));
  } catch (error) {
    // Cualquier excepción inesperada (p. ej. variables de entorno de Supabase
    // ausentes en container.ts) debe seguir devolviendo JSON — si no, el
    // frontend recibe un cuerpo no-JSON y muestra un error genérico y
    // engañoso ("no se pudo contactar con el servidor").
    logger.error("Error inesperado en /api/usuarios/registro", error, { ruta: "/api/usuarios/registro" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
