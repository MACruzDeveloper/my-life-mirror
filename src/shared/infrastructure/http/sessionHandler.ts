import type { ServerResponse } from "node:http";
import type { z } from "zod";
import type { Result } from "#shared/domain/Result.js";
import type { AuthenticatedUser } from "#modules/accounts/domain/AuthProvider.js";
import { type AppContext, getAppContext } from "#shared/infrastructure/container.js";
import { REFRESH_COOKIE, SESSION_COOKIE, readCookie, sessionCookies } from "#shared/infrastructure/cookies.js";
import { logger } from "#shared/infrastructure/logger.js";
import type { HttpHandler, HttpRequest } from "./router.js";
import { isBodyTooLarge, isCrossOrigin } from "./requestChecks.js";

/** Un error de dominio (o con su misma forma): `code` decide el estado HTTP. */
interface ErrorWithCode {
  code: string;
  message: string;
  /** RF-43: por qué no se puede compartir; la interfaz lo traduce. */
  reason?: string;
  /** SEC-01: qué requisitos de la contraseña fallan; la interfaz los traduce. */
  rules?: readonly string[];
}

/** Cabeceras de una respuesta; `Set-Cookie` puede llevar varias (las dos cookies de sesión, SEC-05). */
type Headers = Record<string, string | string[]>;

/** Una respuesta a medida, cuando el Result no basta (cabeceras propias, un 409 previo…). */
export class Reply {
  readonly status: number;
  readonly body: unknown;
  readonly headers: Headers;
  /** Indentado: un archivo para descargar y leer (RF-05). */
  readonly pretty: boolean;

  constructor(status: number, body: unknown, headers: Headers = {}, { pretty = false }: { pretty?: boolean } = {}) {
    this.status = status;
    this.body = body;
    this.headers = headers;
    this.pretty = pretty;
  }
}

export const reply = (status: number, body: unknown, headers?: Headers, format?: { pretty?: boolean }) => new Reply(status, body, headers, format);

export type Outcome = Result<unknown, ErrorWithCode> | Reply;

export interface ActionInput<B> {
  context: AppContext;
  /** Siempre de la sesión verificada en el servidor, nunca del cuerpo. */
  user: AuthenticatedUser;
  body: B;
  query: URLSearchParams;
  req: HttpRequest;
}

/** Lo que hace un método del controlador: su esquema (si lee cuerpo), su estado de éxito y el caso de uso. */
export interface SessionAction {
  readonly schema?: z.ZodTypeAny;
  readonly status: number;
  readonly execute: (input: ActionInput<unknown>) => Promise<Outcome>;
}

export function action<S extends z.ZodTypeAny>(definition: { schema: S; status?: number; execute: (input: ActionInput<z.infer<S>>) => Promise<Outcome> }): SessionAction;
export function action(definition: { status?: number; execute: (input: ActionInput<undefined>) => Promise<Outcome> }): SessionAction;
export function action(definition: { schema?: z.ZodTypeAny; status?: number; execute: (input: ActionInput<never>) => Promise<Outcome> }): SessionAction {
  return { schema: definition.schema, status: definition.status ?? 200, execute: definition.execute as SessionAction["execute"] };
}

const METHODS = ["GET", "POST", "PATCH", "DELETE"] as const;
type Method = (typeof METHODS)[number];

const STATUS_BY_CODE: Record<string, number> = {
  NOT_FOUND: 404,
  CONFLICT: 409,
  CONSENT_REQUIRED: 409,
  FORBIDDEN: 403,
  // 403, no 401: la sesión es válida; lo que falla es la confirmación con la contraseña.
  AUTHENTICATION_ERROR: 403,
  NOT_SHAREABLE: 422,
};

/** Estado y cuerpo de un error de dominio: una sola tabla para todos los controladores. */
export function errorResponse(error: ErrorWithCode): [number, Record<string, unknown>] {
  return [STATUS_BY_CODE[error.code] ?? 400, { error: error.message, code: error.code, ...(error.reason && { reason: error.reason }), ...(error.rules && { rules: error.rules }) }];
}

interface SessionHandlerOptions extends Partial<Record<Method, SessionAction>> {
  /** Para el log de errores inesperados. */
  route: string;
  /** Un intento sin permiso (FORBIDDEN), para el log operativo (OWASP A09). */
  onDenied?: (userId: string) => void;
  /** Para los tests; por defecto, el contexto del proceso. */
  getContext?: () => AppContext;
}

/**
 * Plantilla de los controladores con sesión: método (405), sesión (401), cuerpo
 * con zod (400), caso de uso con el usuario de la sesión, y traducción del
 * Result a un estado HTTP con una sola tabla (404, 409, 403, 422…). Un error
 * inesperado es un 500 genérico y queda en el log. Sustituye a la misma
 * secuencia copiada en cada controlador. Además (SEC-03): nada se guarda en
 * caché (son datos de una persona) y una acción que cambia datos pedida desde
 * otra web se rechaza (403).
 */
export function sessionHandler(options: SessionHandlerOptions): HttpHandler {
  const getContext = options.getContext ?? getAppContext;

  function send(res: ServerResponse, status: number, body: unknown, headers: Headers = {}, pretty = false) {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers });
    res.end(pretty ? JSON.stringify(body, null, 2) : JSON.stringify(body));
  }

  return async (req, res) => {
    try {
      const method = METHODS.find((candidate) => candidate === req.method);
      const handlerAction = method ? options[method] : undefined;
      if (!handlerAction) return send(res, 405, { error: "Método no permitido" });
      if (method !== "GET" && isCrossOrigin(req)) return send(res, 403, { error: "Origen no permitido" });

      const context = getContext();
      // SEC-05: si el token de acceso caducó, se renueva con el de renovación y la respuesta trae las cookies nuevas.
      const session = await context.resumeSession({ token: readCookie(req.headers.cookie, SESSION_COOKIE), refreshToken: readCookie(req.headers.cookie, REFRESH_COOKIE) });
      if (!session.ok) return send(res, 401, { error: "No autenticado", code: "SESSION_EXPIRED" });
      const user = session.value.user;
      const renewed: Headers = session.value.renewed ? { "Set-Cookie": sessionCookies(session.value.renewed) } : {};

      let body: unknown = undefined;
      if (handlerAction.schema && method !== "GET") {
        if (isBodyTooLarge(req.body)) return send(res, 413, { error: "Petición demasiado grande" }, renewed);
        const data = handlerAction.schema.safeParse(req.body);
        if (!data.success) return send(res, 400, { error: "Petición mal formada" }, renewed);
        body = data.data;
      }

      const query = new URL(req.url ?? "", "http://localhost").searchParams;
      const outcome = await handlerAction.execute({ context, user, body, query, req });
      // Las cabeceras propias de la acción mandan (borrar la cuenta borra las cookies aunque se acabaran de renovar).
      if (outcome instanceof Reply) return send(res, outcome.status, outcome.body, { ...renewed, ...outcome.headers }, outcome.pretty);
      // Sin valor, `{ ok: true }`; un `null` a propósito ("aún no hay perfil") se respeta.
      if (outcome.ok) return send(res, handlerAction.status, outcome.value === undefined ? { ok: true } : outcome.value, renewed);

      const error = outcome.error;
      if (error.code === "FORBIDDEN") options.onDenied?.(user.id);
      const [status, errorBody] = errorResponse(error);
      send(res, status, errorBody, renewed);
    } catch (error) {
      logger.error(`Error inesperado en ${options.route}`, error, { route: options.route });
      send(res, 500, { error: "Error interno del servidor" });
    }
  };
}
