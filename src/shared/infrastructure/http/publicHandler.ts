import { createHash } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { z } from "zod";
import type { AttemptLimit } from "#shared/domain/AttemptLimiter.js";
import { type AppContext, getAppContext } from "#shared/infrastructure/container.js";
import { logger } from "#shared/infrastructure/logger.js";
import type { HttpHandler, HttpRequest } from "./router.js";
import { clientIp, isBodyTooLarge, isCrossOrigin } from "./requestChecks.js";
import { type Outcome, Reply, errorResponse } from "./sessionHandler.js";

/** Tope de intentos de un controlador público (SEC-02). */
export interface PublicLimit<B> {
  /** Para separar los contadores de cada acción ("login", "register"…). */
  name: string;
  perIp: AttemptLimit;
  /** Por cuenta: frena a quien cambia de IP para insistir contra el mismo email. */
  perIdentity?: AttemptLimit;
  identity?: (body: B) => string;
}

interface PublicHandlerOptions<S extends z.ZodTypeAny> {
  /** Para el log de errores inesperados. */
  route: string;
  schema: S;
  status?: number;
  limit?: PublicLimit<z.infer<S>>;
  execute: (input: { context: AppContext; body: z.infer<S>; req: HttpRequest }) => Promise<Outcome>;
  /** Para los tests; por defecto, el contexto del proceso. */
  getContext?: () => AppContext;
}

/** Los contadores guardan un resumen, nunca el email ni la IP. */
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Plantilla de los controladores SIN sesión (inicio de sesión, registro,
 * recuperar y cambiar la contraseña): los que cualquiera puede llamar, y por
 * eso los que hay que frenar. Método (405), origen (403), tamaño (413), cuerpo
 * con zod y longitudes máximas (400), tope de intentos por IP y por cuenta (429), caso
 * de uso, y traducción del Result con la misma tabla que `sessionHandler`.
 * Nunca se guardan en caché.
 */
export function publicHandler<S extends z.ZodTypeAny>(options: PublicHandlerOptions<S>): HttpHandler {
  const getContext = options.getContext ?? getAppContext;

  function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string | string[]> = {}) {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers });
    res.end(JSON.stringify(body));
  }

  /** El límite que se ha superado, si hay alguno. Si el contador falla, se deja pasar: mejor sin freno un rato que nadie pueda entrar. */
  async function exceededLimit(context: AppContext, req: HttpRequest, body: z.infer<S>): Promise<AttemptLimit | undefined> {
    const limit = options.limit;
    if (!limit) return undefined;
    const checks: [string, AttemptLimit][] = [[`${limit.name}:ip:${digest(clientIp(req))}`, limit.perIp]];
    const identity = limit.identity?.(body).trim().toLowerCase();
    if (limit.perIdentity && identity) checks.push([`${limit.name}:id:${digest(identity)}`, limit.perIdentity]);
    try {
      for (const [key, attemptLimit] of checks) {
        if (!(await context.attemptLimiter.tryConsume(key, attemptLimit))) return attemptLimit;
      }
    } catch (error) {
      logger.error(`No se pudo comprobar el límite de intentos en ${options.route} (se deja pasar)`, error, { route: options.route });
    }
    return undefined;
  }

  return async (req, res) => {
    try {
      if (req.method !== "POST") return send(res, 405, { error: "Método no permitido" });
      if (isCrossOrigin(req)) return send(res, 403, { error: "Origen no permitido" });

      if (isBodyTooLarge(req.body)) return send(res, 413, { error: "Petición demasiado grande" });
      const data = options.schema.safeParse(req.body);
      if (!data.success) return send(res, 400, { error: "Petición mal formada" });

      const context = getContext();
      const exceeded = await exceededLimit(context, req, data.data);
      if (exceeded) {
        logger.warn(`Límite de intentos superado en ${options.route}`, { route: options.route });
        return send(res, 429, { error: "Demasiados intentos. Espera unos minutos y vuelve a probar.", code: "RATE_LIMITED" }, { "Retry-After": String(exceeded.windowSeconds) });
      }

      const outcome = await options.execute({ context, body: data.data, req });
      if (outcome instanceof Reply) return send(res, outcome.status, outcome.body, outcome.headers);
      if (outcome.ok) return send(res, options.status ?? 200, outcome.value === undefined ? { ok: true } : outcome.value);
      send(res, ...errorResponse(outcome.error));
    } catch (error) {
      logger.error(`Error inesperado en ${options.route}`, error, { route: options.route });
      send(res, 500, { error: "Error interno del servidor" });
    }
  };
}
