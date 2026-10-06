import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { getAppContext } from "#shared/infrastructure/container.js";
import { readCookie } from "#shared/infrastructure/cookies.js";
import { logger } from "#shared/infrastructure/logger.js";

const ReportSchema = z.object({ id: z.string().min(1) });

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/**
 * Controlador HTTP — RF-43, lo que comparten otras personas (`/api/categories/shared`):
 * GET `?categoryId=&locale=` lista las de la misma categoría del catálogo (solo
 * id y texto) y POST `{ id }` reporta una, que deja de verse al momento.
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "GET" && req.method !== "POST") return send(res, 405, { error: "Método no permitido" });

    const { verifySession, listSharedExperiences, reportSharedExperience } = getAppContext();
    const session = await verifySession(readCookie(req.headers.cookie, "sesion"));
    if (!session.ok) return send(res, 401, { error: "No autenticado" });
    const userId = session.value.id;

    if (req.method === "GET") {
      const params = new URL(req.url ?? "", "http://localhost").searchParams;
      const result = await listSharedExperiences({ userId, categoryId: params.get("categoryId") ?? "", locale: params.get("locale") ?? "" });
      return result.ok ? send(res, 200, result.value) : send(res, 400, { error: result.error.message });
    }

    const data = ReportSchema.safeParse(req.body);
    if (!data.success) return send(res, 400, { error: "Petición mal formada" });
    const result = await reportSharedExperience({ userId, experienceId: data.data.id });
    return result.ok ? send(res, 200, { reported: true }) : send(res, 404, { error: result.error.message });
  } catch (error) {
    logger.error("Error inesperado en /api/categories/shared", error, { route: "/api/categories/shared" });
    return send(res, 500, { error: "Error interno del servidor" });
  }
}
