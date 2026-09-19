import type { IncomingMessage, ServerResponse } from "node:http";

export type PeticionHttp = IncomingMessage & { body: unknown };
export type ManejadorHttp = (req: PeticionHttp, res: ServerResponse) => Promise<void> | void;

/**
 * Despacha por el último segmento de la URL a un handler de la tabla. El plan
 * Hobby de Vercel limita a 12 funciones serverless por despliegue, y cada
 * archivo de `api/` es una: agrupar las acciones de una misma capacidad
 * (`/api/accounts/login`, `/api/accounts/logout`...) tras un único
 * `api/<capacidad>/[action].ts` mantiene las URLs y reduce las funciones.
 * Regla del proyecto: una función por capacidad, no por acción.
 */
export function createRouter(prefijo: string, rutas: Record<string, ManejadorHttp>): ManejadorHttp {
  return async (req, res) => {
    const ruta = (req.url ?? "").split("?")[0];
    const accion = ruta.startsWith(prefijo) ? ruta.slice(prefijo.length).replace(/\/$/, "") : undefined;
    const handler = accion && Object.hasOwn(rutas, accion) ? rutas[accion] : undefined;

    if (!handler) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No encontrado" }));
      return;
    }
    await handler(req, res);
  };
}
