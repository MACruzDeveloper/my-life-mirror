import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import type { Experience } from "#modules/assessments/domain/Experience.js";
import { getAppContext } from "#shared/infrastructure/container.js";
import { readCookie } from "#shared/infrastructure/cookies.js";
import { logger } from "#shared/infrastructure/logger.js";

const AddExperienceSchema = z.object({
  categoryId: z.string().min(1),
  text: z.string().max(2000),
});

/** RF-43: compartir (con el idioma en que se escribió) o dejar de compartir. */
const ShareSchema = z.discriminatedUnion("shared", [
  z.object({ id: z.string().min(1), shared: z.literal(true), locale: z.string().min(1) }),
  z.object({ id: z.string().min(1), shared: z.literal(false) }),
]);

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/** Lo que ve su autor: si está compartida o retirada tras un reporte, sin los detalles internos. */
function toDto(experience: Experience) {
  return {
    id: experience.id,
    categoryId: experience.categoryId,
    text: experience.text,
    createdAt: experience.createdAt,
    shared: experience.sharedAt !== undefined,
    reported: experience.reportedAt !== undefined,
  };
}

/**
 * Controlador HTTP — RF-44, el diario de experiencias (`/api/categories/diary`):
 * GET lista las del usuario, POST añade una (sin puntuar), DELETE `?id=` borra
 * una suya y PATCH la comparte o deja de compartir (RF-43). El usuario sale
 * siempre de la cookie, nunca del cuerpo.
 */
export default async function handler(req: IncomingMessage & { body: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE" && req.method !== "PATCH") return send(res, 405, { error: "Método no permitido" });

    const { verifySession, listExperiences, addExperience, deleteExperience, shareExperience, unshareExperience } = getAppContext();
    const session = await verifySession(readCookie(req.headers.cookie, "sesion"));
    if (!session.ok) return send(res, 401, { error: "No autenticado" });
    const userId = session.value.id;

    if (req.method === "GET") {
      const result = await listExperiences(userId);
      return result.ok ? send(res, 200, result.value.map(toDto)) : send(res, 400, { error: result.error.message });
    }

    if (req.method === "DELETE") {
      const experienceId = new URL(req.url ?? "", "http://localhost").searchParams.get("id") ?? "";
      const result = await deleteExperience({ userId, experienceId });
      return result.ok ? send(res, 200, { deleted: true }) : send(res, 404, { error: result.error.message });
    }

    if (req.method === "PATCH") {
      const data = ShareSchema.safeParse(req.body);
      if (!data.success) return send(res, 400, { error: "Petición mal formada" });
      const result = data.data.shared
        ? await shareExperience({ userId, experienceId: data.data.id, locale: data.data.locale })
        : await unshareExperience({ userId, experienceId: data.data.id });
      if (result.ok) return send(res, 200, toDto(result.value));
      if (result.error.code === "NOT_SHAREABLE" && "reason" in result.error) return send(res, 422, { error: result.error.message, reason: result.error.reason });
      return send(res, result.error.code === "NOT_FOUND" ? 404 : 400, { error: result.error.message });
    }

    const data = AddExperienceSchema.safeParse(req.body);
    if (!data.success) return send(res, 400, { error: "Petición mal formada" });
    const result = await addExperience({ userId, ...data.data });
    if (!result.ok) return send(res, result.error.code === "NOT_FOUND" ? 404 : 400, { error: result.error.message });
    return send(res, 201, toDto(result.value));
  } catch (error) {
    logger.error("Error inesperado en /api/categories/diary", error, { route: "/api/categories/diary" });
    return send(res, 500, { error: "Error interno del servidor" });
  }
}
