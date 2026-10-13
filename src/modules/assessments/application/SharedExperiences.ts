import { type Result, err, ok } from "#shared/domain/Result.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import type { Clock } from "#shared/domain/Clock.js";
import { isSupportedLocale } from "#shared/domain/locales.js";
import type { CategoryCatalogRepository } from "#modules/categories/domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { isExcludedFromSharing } from "#modules/categories/domain/CatalogCategory.js";
import { checkShareableText } from "#modules/recommendations/domain/shareableText.js";
import type { AssessmentRepository } from "../domain/AssessmentRepository.js";
import {
  type Experience,
  type ExperienceRepository,
  MAX_SHARED_LISTED,
  NotShareableError,
  SHARE_MIN_SCORE,
  type SharedExperience,
} from "../domain/Experience.js";

interface CategoryLookup {
  categoryRepository: CategoryRepository;
  catalog: CategoryCatalogRepository;
}

/**
 * La clave con la que se agrupan las experiencias compartidas de una categoría, si se puede
 * compartir en ella; si no, `undefined`. Las nueve categorías originales tienen clave propia
 * (`economia`); las añadidas después desde administración no, y se agrupan por su identificador
 * del catálogo. Antes quedaban fuera de compartir sin avisar (fallo real, 12 oct.).
 */
async function shareableCategoryKey({ categoryRepository, catalog }: CategoryLookup, userId: string, categoryId: string): Promise<string | undefined> {
  const category = await categoryRepository.findById(userId, categoryId);
  if (!category || category.type !== "standard") return undefined;
  const catalogEntry = (await catalog.findAll()).find((entry) => entry.id === category.catalogId);
  if (!catalogEntry || isExcludedFromSharing(category.isSensitiveData, catalogEntry)) return undefined;
  return catalogEntry.key ?? `catalogo:${catalogEntry.id}`;
}

async function findOwn(experienceRepository: ExperienceRepository, userId: string, experienceId: string): Promise<Experience | undefined> {
  return (await experienceRepository.findByUserId(userId.trim())).find((experience) => experience.id === experienceId.trim());
}

/**
 * Casos de uso — RF-43 (ver la historia, Nivel 3, que manda sobre este código).
 * Compartir es voluntario y experiencia a experiencia; lo que se protege es a
 * quien lee: filtros al publicar y un reporte que oculta al momento.
 */
export function createShareExperience(deps: CategoryLookup & { experienceRepository: ExperienceRepository; assessmentRepository: AssessmentRepository; clock: Clock }) {
  const { experienceRepository, assessmentRepository, clock } = deps;

  return async function shareExperience(input: { userId: string; experienceId: string; locale: string }): Promise<Result<Experience, NotFoundError | ValidationError | NotShareableError>> {
    if (!isSupportedLocale(input.locale)) return err(new ValidationError("Locale is not supported"));
    const experience = await findOwn(experienceRepository, input.userId, input.experienceId);
    if (!experience) return err(new NotFoundError("Experience not found"));
    if (experience.reportedAt) return err(new NotShareableError("reported"));
    if (experience.sharedAt) return ok(experience);

    const categoryKey = await shareableCategoryKey(deps, experience.userId, experience.categoryId);
    if (!categoryKey) return err(new NotShareableError("category"));

    const latest = (await assessmentRepository.findByUserId(experience.userId))
      .filter((assessment) => assessment.categoryId === experience.categoryId)
      .reduce<{ score: number; recordedAt: Date } | undefined>((current, assessment) => (!current || assessment.recordedAt >= current.recordedAt ? assessment : current), undefined);
    if (!latest || latest.score < SHARE_MIN_SCORE) return err(new NotShareableError("score"));

    const check = checkShareableText(experience.text);
    if (!check.ok) return err(new NotShareableError(check.reason));

    const shared: Experience = { ...experience, sharedAt: clock.now(), sharedLocale: input.locale, sharedCategoryKey: categoryKey };
    await experienceRepository.save(shared);
    return ok(shared);
  };
}

export function createUnshareExperience(experienceRepository: ExperienceRepository) {
  return async function unshareExperience(input: { userId: string; experienceId: string }): Promise<Result<Experience, NotFoundError>> {
    const experience = await findOwn(experienceRepository, input.userId, input.experienceId);
    if (!experience) return err(new NotFoundError("Experience not found"));
    // Se conserva `reportedAt`: una reportada no puede volver a compartirse.
    const privateExperience: Experience = { ...experience, sharedAt: undefined, sharedLocale: undefined, sharedCategoryKey: undefined };
    await experienceRepository.save(privateExperience);
    return ok(privateExperience);
  };
}

/** Las de otras personas en la misma categoría del catálogo que `categoryId` (una del lector) y en su idioma. */
export function createListSharedExperiences(deps: CategoryLookup & { experienceRepository: ExperienceRepository }) {
  return async function listSharedExperiences(input: { userId: string; categoryId: string; locale: string }): Promise<Result<SharedExperience[], ValidationError>> {
    if (!isSupportedLocale(input.locale)) return err(new ValidationError("Locale is not supported"));
    const userId = input.userId.trim();
    const categoryKey = await shareableCategoryKey(deps, userId, input.categoryId.trim());
    if (!categoryKey) return ok([]);
    return ok(await deps.experienceRepository.findShared({ categoryKey, locale: input.locale, excludeUserId: userId, limit: MAX_SHARED_LISTED }));
  };
}

export function createReportSharedExperience({ experienceRepository, clock }: { experienceRepository: ExperienceRepository; clock: Clock }) {
  return async function reportSharedExperience(input: { userId: string; experienceId: string }): Promise<Result<true, NotFoundError>> {
    const reported = await experienceRepository.report(input.experienceId.trim(), input.userId.trim(), clock.now());
    return reported ? ok(true) : err(new NotFoundError("Shared experience not found"));
  };
}
