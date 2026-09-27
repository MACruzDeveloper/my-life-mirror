import type { ServerResponse } from "node:http";
import { z } from "zod";
import type { Result } from "../../../../domain/Result.js";
import type { UsuarioAutenticado } from "../../../../../modules/cuentas/domain/AuthProvider.js";
import { type AppContext, obtenerAppContext } from "../../../container.js";
import { leerCookie } from "../../../cookies.js";
import { logger } from "../../../logger.js";
import type { ManejadorHttp, PeticionHttp } from "../../router.js";

function responder(res: ServerResponse, status: number, cuerpo: unknown) {
  // Datos de administración: que ninguna caché intermedia los conserve.
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(cuerpo));
}

const ESTADO_POR_CODIGO: Record<string, number> = {
  FORBIDDEN: 403,
  // 403, no 401: la sesión es válida; lo que falla es la confirmación con la contraseña.
  AUTHENTICATION_ERROR: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

interface ErrorConCodigo {
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
  ruta: string;
  metodo: "GET" | "POST";
  schema?: S;
  ejecutar: (contexto: AppContext, actor: UsuarioAutenticado, cuerpo: z.infer<S>) => Promise<Result<T, ErrorConCodigo>>;
}): ManejadorHttp {
  return async (req: PeticionHttp, res: ServerResponse) => {
    try {
      if (req.method !== options.metodo) {
        responder(res, 405, { error: "Método no permitido" });
        return;
      }

      const contexto = obtenerAppContext();
      const sesion = await contexto.verificarSesion(leerCookie(req.headers.cookie, "sesion"));
      if (!sesion.ok) {
        responder(res, 401, { error: "No autenticado" });
        return;
      }

      let cuerpo: z.infer<S> = undefined as z.infer<S>;
      if (options.schema) {
        const datos = options.schema.safeParse(req.body);
        if (!datos.success) {
          responder(res, 400, { error: "Petición mal formada" });
          return;
        }
        cuerpo = datos.data;
      }

      const resultado = await options.ejecutar(contexto, sesion.value, cuerpo);
      if (!resultado.ok) {
        if (resultado.error.code === "FORBIDDEN") {
          logger.warn("Acceso de administración denegado", { ruta: options.ruta, usuario: sesion.value.id });
        }
        responder(res, ESTADO_POR_CODIGO[resultado.error.code] ?? 400, { error: resultado.error.message, code: resultado.error.code });
        return;
      }
      responder(res, 200, resultado.value ?? { ok: true });
    } catch (error) {
      logger.error(`Error inesperado en ${options.ruta}`, error, { ruta: options.ruta });
      responder(res, 500, { error: "Error interno del servidor" });
    }
  };
}
