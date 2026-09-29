import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "../../../container.js";
import { clearedSessionCookie, readCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";

const DeleteAccountSchema = z.object({ password: z.string() });

/**
 * Controlador HTTP — RF-05. Elimina la cuenta y todos sus datos tras
 * comprobar la contraseña. El id y el email salen de la sesión verificada en
 * el servidor; del cuerpo solo se lee la contraseña. Al terminar borra la
 * cookie de sesión.
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = readCookie(req.headers.cookie, "sesion");
    const { verifySession: verificarSesion, deleteAccount } = getAppContext();
    const session = await verificarSesion(token);
    if (!session.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const data = DeleteAccountSchema.safeParse(req.body);
    if (!data.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const result = await deleteAccount({ userId: session.value.id, email: session.value.email, password: data.data.password });
    if (!result.ok) {
      // 403, no 401: la sesión es válida; lo que falla es la confirmación (un 401 podría hacer creer al cliente que la sesión caducó).
      const status = result.error.code === "AUTHENTICATION_ERROR" ? 403 : result.error.code === "CONFLICT" ? 409 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error.message, code: result.error.code }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": clearedSessionCookie() });
    res.end(JSON.stringify({ deleted: true }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/delete-account", error, { route: "/api/accounts/delete-account" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
