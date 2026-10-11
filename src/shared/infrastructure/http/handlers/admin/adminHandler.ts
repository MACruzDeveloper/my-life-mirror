import type { z } from "zod";
import type { Result } from "#shared/domain/Result.js";
import type { AuthenticatedUser } from "#modules/accounts/domain/AuthProvider.js";
import type { AppContext } from "#shared/infrastructure/container.js";
import { logger } from "#shared/infrastructure/logger.js";
import type { HttpHandler } from "#shared/infrastructure/http/router.js";
import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

interface ErrorWithCode {
  code: string;
  message: string;
}

/**
 * Plantilla de los controladores de ADM-03, sobre `sessionHandler`: el `actor` es
 * el usuario de la sesión verificada en el servidor (nunca del cuerpo), sin caché
 * intermedia, y un intento sin permiso queda en el log operativo (OWASP A09).
 */
export function adminHandler<S extends z.ZodTypeAny, T>(options: {
  route: string;
  method: "GET" | "POST";
  schema?: S;
  execute: (context: AppContext, actor: AuthenticatedUser, body: z.infer<S>) => Promise<Result<T, ErrorWithCode>>;
}): HttpHandler {
  const run = action({ schema: options.schema as z.ZodTypeAny, execute: ({ context, user, body }) => options.execute(context, user, body as z.infer<S>) });
  return sessionHandler({
    route: options.route,
    onDenied: (userId) => logger.warn("Acceso de administración denegado", { route: options.route, userId }),
    [options.method]: run,
  });
}
