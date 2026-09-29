import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Result } from "../../../../domain/Result.js";
import type { AuthenticatedUser } from "../../../../../modules/accounts/domain/AuthProvider.js";
import { type AppContext, getAppContext } from "../../../container.js";
import { readCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";
import type { HttpHandler, HttpRequest } from "../../router.js";

function responder(res: ServerResponse, status: number, body: unknown) {
  // Datos de administración: que ninguna caché intermedia los conserve.
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

const STATUS_BY_CODE: Record<string, number> = {
  FORBIDDEN: 403,
  // 403, no 401: la sesión es válida; lo que falla es la confirmación con la contraseña.
  AUTHENTICATION_ERROR: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

interface ErrorWithCode {
  code: string;
  message: string;
}

/**
 * Plantilla de los controladores de ADM-03: comprueba la sesión (401), valida
 * el cuerpo con zod (400), ejecuta el caso de uso con el `actor` de la sesión
 * verificada en el servidor (nunca del cuerpo) y traduce el Result a un
 * estado HTTP. Un intento sin permiso queda en el log operativo (OWASP A09).
 * `metodo` GET no lee cuerpo.
 */
export function adminHandler<S extends z.ZodTypeAny, T>(options: {
  route: string;
  method: "GET" | "POST";
  schema?: S;
  execute: (context: AppContext, actor: AuthenticatedUser, body: z.infer<S>) => Promise<Result<T, ErrorWithCode>>;
}): HttpHandler {
  return async (req: HttpRequest, res: ServerResponse) => {
    try {
      if (req.method !== options.method) {
        responder(res, 405, { error: "Método no permitido" });
        return;
      }

      const context = getAppContext();
      const session = await context.verifySession(readCookie(req.headers.cookie, "sesion"));
      if (!session.ok) {
        responder(res, 401, { error: "No autenticado" });
        return;
      }

      let body: z.infer<S> = undefined as z.infer<S>;
      if (options.schema) {
        const data = options.schema.safeParse(req.body);
        if (!data.success) {
          responder(res, 400, { error: "Petición mal formada" });
          return;
        }
        body = data.data;
      }

      const result = await options.execute(context, session.value, body);
      if (!result.ok) {
        if (result.error.code === "FORBIDDEN") {
          logger.warn("Acceso de administración denegado", { route: options.route, userId: session.value.id });
        }
        responder(res, STATUS_BY_CODE[result.error.code] ?? 400, { error: result.error.message, code: result.error.code });
        return;
      }
      responder(res, 200, result.value ?? { ok: true });
    } catch (error) {
      logger.error(`Error inesperado en ${options.route}`, error, { route: options.route });
      responder(res, 500, { error: "Error interno del servidor" });
    }
  };
}
