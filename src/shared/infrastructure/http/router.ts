import type { IncomingMessage, ServerResponse } from "node:http";

export type HttpRequest = IncomingMessage & { body: unknown };
export type HttpHandler = (req: HttpRequest, res: ServerResponse) => Promise<void> | void;

/**
 * Despacha por el último segmento de la URL a un handler de la tabla. El plan
 * Hobby de Vercel limita a 12 funciones serverless por despliegue, y cada
 * archivo de `api/` es una: agrupar las acciones de una misma capacidad
 * (`/api/accounts/login`, `/api/accounts/logout`...) tras un único
 * `api/<capacidad>/[action].ts` mantiene las URLs y reduce las funciones.
 * Regla del proyecto: una función por capacidad, no por acción.
 */
export function createRouter(prefix: string, routes: Record<string, HttpHandler>): HttpHandler {
  return async (req, res) => {
    const path = (req.url ?? "").split("?")[0];
    const action = path.startsWith(prefix) ? path.slice(prefix.length).replace(/\/$/, "") : undefined;
    const handler = action && Object.hasOwn(routes, action) ? routes[action] : undefined;

    if (!handler) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No encontrado" }));
      return;
    }
    await handler(req, res);
  };
}
