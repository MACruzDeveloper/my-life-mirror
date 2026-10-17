import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "#shared/domain/Result.js";
import { type Actor, requireAdmin } from "#shared/domain/Actor.js";
import type { Clock } from "#shared/domain/Clock.js";
import { ConflictError, type ForbiddenError, NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import { isSupportedLocale } from "#shared/domain/locales.js";
import { STANDARD_CATEGORIES } from "../domain/standardCategories.js";
import {
  type InspirationVideo,
  type InspirationVideoRepository,
  MAX_VIDEO_TITLE_LENGTH,
  MAX_VIDEOS_PER_PAGE,
  parseYoutubeId,
} from "../domain/InspirationVideo.js";

export interface AddInspirationVideoInput {
  categoryKey: string;
  locale: string;
  /** El enlace de YouTube o el identificador. */
  youtubeUrl: string;
  title: string;
}

/** Lo que ve la página: sin fecha. */
export type InspirationVideoView = Pick<InspirationVideo, "id" | "categoryKey" | "locale" | "youtubeId" | "title">;

function toView({ id, categoryKey, locale, youtubeId, title }: InspirationVideo): InspirationVideoView {
  return { id, categoryKey, locale, youtubeId, title };
}

type VideoFields = Pick<InspirationVideo, "categoryKey" | "locale" | "youtubeId" | "title">;

/** Las reglas de un vídeo, al añadirlo y al editarlo. `exceptId`: el que se edita no choca consigo mismo. */
async function validate(repository: InspirationVideoRepository, input: AddInspirationVideoInput, exceptId?: string): Promise<Result<VideoFields, ValidationError | ConflictError>> {
  if (!STANDARD_CATEGORIES.some((category) => category.key === input.categoryKey)) return err(new ValidationError("Unknown category"));
  if (!isSupportedLocale(input.locale)) return err(new ValidationError("Unsupported language"));
  const youtubeId = parseYoutubeId(input.youtubeUrl);
  if (!youtubeId) return err(new ValidationError("Not a YouTube link"));
  const title = input.title.trim();
  if (title.length === 0 || title.length > MAX_VIDEO_TITLE_LENGTH) return err(new ValidationError(`Title must be 1-${MAX_VIDEO_TITLE_LENGTH} characters`));

  const samePage = (await repository.findByCategory(input.categoryKey)).filter((video) => video.locale === input.locale && video.id !== exceptId);
  if (samePage.some((video) => video.youtubeId === youtubeId)) return err(new ConflictError("That video is already on this page"));
  if (samePage.length >= MAX_VIDEOS_PER_PAGE) return err(new ValidationError(`At most ${MAX_VIDEOS_PER_PAGE} videos per category and language`));
  return ok({ categoryKey: input.categoryKey, locale: input.locale, youtubeId, title });
}

const byAddedOrder = (a: InspirationVideo, b: InspirationVideo) => a.createdAt.getTime() - b.createdAt.getTime();

/** Caso de uso — ADM-04: añadir un vídeo a una categoría, en un idioma. Solo administración. */
export function createAddInspirationVideo({ repository, clock }: { repository: InspirationVideoRepository; clock: Clock }) {
  return async function addInspirationVideo(actor: Actor, input: AddInspirationVideoInput): Promise<Result<InspirationVideoView, ForbiddenError | ValidationError | ConflictError>> {
    const permission = requireAdmin(actor);
    if (!permission.ok) return permission;

    const fields = await validate(repository, input);
    if (!fields.ok) return fields;

    const video: InspirationVideo = { id: randomUUID(), ...fields.value, createdAt: clock.now() };
    await repository.save(video);
    return ok(toView(video));
  };
}

/** Caso de uso — ADM-04: editar un vídeo (categoría, idioma, enlace y título), con las mismas reglas. Conserva su lugar en el orden. Solo administración. */
export function createUpdateInspirationVideo(repository: InspirationVideoRepository) {
  return async function updateInspirationVideo(actor: Actor, id: string, input: AddInspirationVideoInput): Promise<Result<InspirationVideoView, ForbiddenError | ValidationError | ConflictError | NotFoundError>> {
    const permission = requireAdmin(actor);
    if (!permission.ok) return permission;
    const current = await repository.findById(id.trim());
    if (!current) return err(new NotFoundError("Video not found"));
    const fields = await validate(repository, input, current.id);
    if (!fields.ok) return fields;

    const video: InspirationVideo = { ...current, ...fields.value };
    await repository.save(video);
    return ok(toView(video));
  };
}

/** Caso de uso — ADM-04: todos los vídeos, para el panel. Solo administración. */
export function createListAllInspirationVideos(repository: InspirationVideoRepository) {
  return async function listAllInspirationVideos(actor: Actor): Promise<Result<InspirationVideoView[], ForbiddenError>> {
    const permission = requireAdmin(actor);
    if (!permission.ok) return permission;
    return ok((await repository.findAll()).sort(byAddedOrder).map(toView));
  };
}

/** Caso de uso — ADM-04: quitar un vídeo. Solo administración. */
export function createDeleteInspirationVideo(repository: InspirationVideoRepository) {
  return async function deleteInspirationVideo(actor: Actor, id: string): Promise<Result<void, ForbiddenError | NotFoundError>> {
    const permission = requireAdmin(actor);
    if (!permission.ok) return permission;
    return (await repository.delete(id.trim())) ? ok(undefined) : err(new NotFoundError("Video not found"));
  };
}

/**
 * Caso de uso — RF-49: los vídeos de la página de una categoría, en el idioma
 * de la interfaz; si no hay ninguno en ese idioma, los de los demás (la página
 * dice en qué idioma están). En el orden en que se añadieron.
 */
export function createListInspirationVideos(repository: InspirationVideoRepository) {
  return async function listInspirationVideos(input: { categoryKey: string; locale: string }): Promise<Result<InspirationVideoView[], never>> {
    const ofCategory = (await repository.findByCategory(input.categoryKey)).sort(byAddedOrder);
    const inLocale = ofCategory.filter((video) => video.locale === input.locale);
    return ok((inLocale.length > 0 ? inLocale : ofCategory).map(toView));
  };
}
