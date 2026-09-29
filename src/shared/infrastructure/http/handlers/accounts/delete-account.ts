import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../../../container.js";
import { cookieDeSesionBorrada, leerCookie } from "../../../cookies.js";
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

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, deleteAccount } = obtenerAppContext();
    const sesion = await verificarSesion(token);
    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const datos = DeleteAccountSchema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const resultado = await deleteAccount({ userId: sesion.value.id, email: sesion.value.email, password: datos.data.password });
    if (!resultado.ok) {
      // 403, no 401: la sesión es válida; lo que falla es la confirmación (un 401 podría hacer creer al cliente que la sesión caducó).
      const status = resultado.error.code === "AUTHENTICATION_ERROR" ? 403 : resultado.error.code === "CONFLICT" ? 409 : 400;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message, code: resultado.error.code }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": cookieDeSesionBorrada() });
    res.end(JSON.stringify({ deleted: true }));
  } catch (error) {
    logger.error("Error inesperado en /api/accounts/delete-account", error, { ruta: "/api/accounts/delete-account" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
