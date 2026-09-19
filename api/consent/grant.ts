import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { obtenerAppContext } from "../../src/shared/infrastructure/container";
import { leerCookie } from "../../src/shared/infrastructure/cookies";
import { logger } from "../../src/shared/infrastructure/logger";
import { VERSION_POLITICA_ACTUAL } from "../../src/modules/consentimiento/domain/PoliticaActual";

const GrantConsentSchema = z.object({
  categoryId: z.string(),
});

/**
 * Controlador HTTP — primer endpoint real de RF-04 (hasta ahora solo tenía
 * casos de uso). Se llama tras el modal de consentimiento, antes de
 * reintentar `activate-category`. La versión de política la fija el
 * servidor, igual que en activate-category.ts.
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no permitido" }));
      return;
    }

    const token = leerCookie(req.headers.cookie, "sesion");
    const { verificarSesion, otorgarConsentimiento } = obtenerAppContext();
    const sesion = await verificarSesion(token);

    if (!sesion.ok) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No autenticado" }));
      return;
    }

    const datos = GrantConsentSchema.safeParse(req.body);
    if (!datos.success) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Petición mal formada" }));
      return;
    }

    const resultado = await otorgarConsentimiento({
      usuarioId: sesion.value.id,
      categoriaId: datos.data.categoryId,
      versionPolitica: VERSION_POLITICA_ACTUAL,
    });

    if (!resultado.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: resultado.error.message }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    logger.error("Error inesperado en /api/consent/grant", error, { ruta: "/api/consent/grant" });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno del servidor" }));
  }
}
