import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServerModuleRunner, type Plugin } from "vite";

/**
 * Sirve las funciones de `api/` desde el servidor de Vite, contra un Supabase
 * local en Docker: para los tests E2E (`npm run test:e2e:api`) y para probar la
 * app sin cuentas (`npm run dev:local`). Existe porque `vercel dev` carga siempre el `.env` del proyecto
 * (la base de datos real) aunque se le pasen otras variables — comprobado el
 * 27 sept. —, y un test que registra cuentas no puede tocar la base real.
 *
 * Imita lo que hace Vercel con estas funciones: rutas por archivo (lo concreto
 * gana a `[action]`, `index.ts` responde a su carpeta) y `req.body` ya
 * parseado. Los handlers solo usan la API de Node (`writeHead`/`end`), así que
 * no hace falta nada más. Ver docs/requirements-analysis/04_Plan_Verificacion_Validacion.md apartado 1.1.
 */

export interface ApiRoute {
  /** Ruta relativa a `api/`, p. ej. `accounts/[action].ts`. */
  file: string;
  pattern: RegExp;
  isDynamic: boolean;
  segments: number;
}

export function buildRoutes(files: string[]): ApiRoute[] {
  return files
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts"))
    .map((file) => {
      const segments = file.replace(/\.ts$/, "").split("/");
      if (segments[segments.length - 1] === "index") segments.pop();
      const isDynamic = segments.some((segment) => /^\[.+\]$/.test(segment));
      const source = segments.map((segment) => (/^\[.+\]$/.test(segment) ? "[^/]+" : escapeRegExp(segment))).join("/");
      return { file, pattern: new RegExp(`^/api/${source}/?$`), isDynamic, segments: segments.length };
    })
    .sort((a, b) => Number(a.isDynamic) - Number(b.isDynamic) || b.segments - a.segments);
}

export function matchRoute(routes: ApiRoute[], url: string): ApiRoute | undefined {
  const path = url.split("?")[0];
  return routes.find((route) => route.pattern.test(path));
}

/** Salvaguarda: los tests E2E registran y borran cuentas; solo contra un Supabase local. */
export function assertLocalSupabase(url: string | undefined): void {
  let hostname: string | undefined;
  try {
    hostname = url ? new URL(url).hostname : undefined;
  } catch {
    hostname = undefined;
  }
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error("Este servidor solo arranca con un Supabase local (SUPABASE_URL en 127.0.0.1 o localhost). Usa `npm run dev:local` o `npm run test:e2e:api`.");
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  const text = Buffer.concat(chunks).toString("utf8");
  return (req.headers["content-type"] ?? "").includes("application/json") ? JSON.parse(text) : text;
}

export function vercelApiRoutes(apiDir: string): Plugin {
  return {
    name: "e2e-vercel-api-routes",
    apply: "serve",
    configureServer(server) {
      assertLocalSupabase(process.env.SUPABASE_URL);
      const routes = buildRoutes(readdirSync(apiDir, { recursive: true }).map(String));

      server.middlewares.use(async (req, res: ServerResponse, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const route = matchRoute(routes, req.url);
        if (!route) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No encontrado" }));
          return;
        }
        try {
          const body = await readBody(req);
          // Cada petición carga los módulos en un "runner" nuevo: ninguna función ve la
          // memoria de otra (ni la de una petición anterior). Más estricto que Vercel, que
          // sí reutiliza una instancia caliente de la misma función; así este entorno no
          // puede ocultar el fallo de docs/requirements-analysis/04_Plan_Verificacion_Validacion.md
          // apartado 1.1 (datos en memoria que "funcionan" porque todo corre en un mismo proceso).
          // La caché de transformación de Vite se comparte, así que sigue siendo rápido.
          const runner = createServerModuleRunner(server.environments.ssr, { hmr: false });
          try {
            const module = await runner.import(join(apiDir, route.file));
            await module.default(Object.assign(req, { body }), res);
          } finally {
            await runner.close();
          }
        } catch (error) {
          server.config.logger.error(`[e2e api] ${req.method} ${req.url}: ${String(error)}`);
          if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error interno del servidor" }));
        }
      });
    },
  };
}
