import { type Result, err, ok } from "#shared/domain/Result.js";
import { withTimeout } from "#shared/domain/withTimeout.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import type { Clock } from "#shared/domain/Clock.js";
import { isSupportedLocale, type Locale } from "#shared/domain/locales.js";
import type { ProfileRepository } from "#modules/accounts/domain/ProfileRepository.js";
import type { AssessmentRepository } from "#modules/assessments/domain/AssessmentRepository.js";
import type { CategoryCatalogRepository } from "#modules/categories/domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { isExcludedFromAi } from "#modules/categories/domain/CatalogCategory.js";
import type { IdeaRequest, IdeaReviewer, IdeaTrend, IdeaWriter } from "../domain/IdeaWriter.js";
import type { AiUsageLimiter } from "../domain/AiUsageLimiter.js";
import type { IdeaTexts } from "../domain/IdeaTexts.js";
import { checkIdeaSafety } from "../domain/ideaSafety.js";
import type { PersonalizedIdeaRepository } from "../domain/PersonalizedIdea.js";
import { isOpen } from "../domain/Recommendation.js";
import { allowedTemplateKeys } from "../domain/ideaSituations.js";
import type { RecommendationRepository } from "../domain/RecommendationRepository.js";

export interface PersonalizeRecommendationInput {
  userId: string;
  recommendationId: string;
  /** La idea del carrusel que se está viendo (UX-05); por defecto, la de la recomendación. */
  templateKey?: string;
  locale: string;
}

export type PersonalizedResult = { source: "ai"; templateKey: string; text: string } | { source: "catalog"; templateKey: string };

interface Dependencies {
  recommendationRepository: RecommendationRepository;
  categoryRepository: CategoryRepository;
  catalog: CategoryCatalogRepository;
  assessmentRepository: AssessmentRepository;
  profileRepository: ProfileRepository;
  personalizedIdeaRepository: PersonalizedIdeaRepository;
  ideaTexts: IdeaTexts;
  /** Sin escritor (ningún proveedor configurado) la función está apagada: siempre texto curado. */
  writer?: IdeaWriter;
  reviewer: IdeaReviewer;
  clock: Clock;
  timeoutMs?: number;
  /** Para registrar por qué se cayó al texto curado (lo inyecta el contenedor con el logger). */
  report?: (reason: string, error?: unknown) => void;
  /** RF-40b: tope diario por usuario con el proveedor real; sin él (el *Fake*), no se cuenta. */
  usageLimiter?: AiUsageLimiter;
}

function trendOf(scores: number[]): IdeaTrend {
  if (scores.length < 2) return "first";
  const [latest, previous] = scores;
  return latest > previous ? "up" : latest < previous ? "down" : "steady";
}


/** Mismas opciones, en cualquier orden: la idea guardada sigue valiendo. */
function sameTags(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
}

/**
 * Caso de uso — RF-40 (ver la historia RF-40, Nivel 3, que manda sobre este código).
 * La IA solo reescribe la idea del catálogo que el usuario está viendo (v1.1:
 * el carrusel de UX-05); se guarda por idea e idioma con las opciones de
 * "¿Qué te ayuda?" que usó, y se reescribe si cambian. Cualquier duda
 * o fallo acaba en el texto curado, nunca en un error para el usuario.
 */
export function createPersonalizeRecommendation(deps: Dependencies) {
  const { recommendationRepository, categoryRepository, catalog, assessmentRepository, profileRepository, personalizedIdeaRepository, ideaTexts, writer, reviewer, clock } = deps;
  const timeoutMs = deps.timeoutMs ?? 8000;
  const report = deps.report ?? (() => {});

  return async function personalizeRecommendation(input: PersonalizeRecommendationInput): Promise<Result<PersonalizedResult, NotFoundError | ValidationError>> {
    if (!isSupportedLocale(input.locale)) return err(new ValidationError("Locale is not supported"));
    const locale: Locale = input.locale;

    const recommendation = (await recommendationRepository.findByUserId(input.userId)).find((candidate) => candidate.id === input.recommendationId);
    if (!recommendation) return err(new NotFoundError("Recommendation not found"));

    const category = await categoryRepository.findById(input.userId, recommendation.categoryId);
    const catalogEntry = category ? (await catalog.findAll()).find((entry) => entry.id === category.catalogId) : undefined;
    const categoryKey = catalogEntry?.key;
    const templateKey = input.templateKey ?? recommendation.templateKey;
    // Las mismas que ofrece el carrusel: las de la categoría que no chocan con lo que se le pone difícil
    // (RF-42) o, si chocan todas, las generales. Ni otra categoría ni una que choque, tampoco personalizada.
    if (!allowedTemplateKeys(categoryKey, category?.difficultyTags ?? []).includes(templateKey)) {
      return err(new ValidationError("Template is not offered for this category"));
    }
    const curated: PersonalizedResult = { source: "catalog", templateKey };

    if (!writer || !isOpen(recommendation)) return ok(curated);
    const profile = await profileRepository.findByUserId(input.userId);
    if (profile?.aiIdeasEnabled !== true) return ok(curated);
    // Ni sensibles ni las que el catálogo deja fuera de la IA (Pareja, RF-45 v1.4).
    if (!category || isExcludedFromAi(category.isSensitiveData, catalogEntry) || !categoryKey) return ok(curated);

    // Se reutiliza solo si se escribió con las mismas opciones de "¿Qué te ayuda?" que hay ahora.
    const experienceTags = category.experienceTags ?? [];
    const saved = await personalizedIdeaRepository.find(recommendation.id, templateKey, locale);
    if (saved && sameTags(saved.experienceTags, experienceTags)) return ok({ source: "ai", templateKey: saved.templateKey, text: saved.text });

    const scores = (await assessmentRepository.findByUserId(input.userId))
      .filter((assessment) => assessment.categoryId === category.id)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .map((assessment) => assessment.score);
    const candidates = ideaTexts.candidatesFor(categoryKey, locale).filter((candidate) => candidate.templateKey === templateKey);
    if (scores.length === 0 || candidates.length === 0) return ok(curated);

    const request: IdeaRequest = {
      locale,
      categoryKey,
      score: scores[0],
      trend: trendOf(scores),
      helpfulThings: ideaTexts.experienceLabels(experienceTags, locale),
      candidates,
    };

    try {
      // Solo aquí, cuando de verdad se va a pedir al proveedor: una idea ya guardada no gasta uso.
      if (deps.usageLimiter && !(await deps.usageLimiter.tryConsume(input.userId))) {
        report("tope diario de IA agotado");
        return ok(curated);
      }
      const draft = await withTimeout(writer.write(request), timeoutMs);
      const safety = checkIdeaSafety(draft, request);
      if (!safety.safe) {
        report(`filtro: ${safety.reason}${"detail" in safety && safety.detail ? ` (${safety.detail})` : ""}`);
        return ok(curated);
      }
      const review = await withTimeout(reviewer.review(draft, request), timeoutMs);
      if (!review.approved) {
        report(`revisión: ${review.reasons.join(", ")}`);
        return ok(curated);
      }
      await personalizedIdeaRepository.save({ recommendationId: recommendation.id, userId: input.userId, locale, templateKey: draft.templateKey, text: draft.text.trim(), experienceTags, model: writer.model, createdAt: clock.now() });
      return ok({ source: "ai", templateKey: draft.templateKey, text: draft.text.trim() });
    } catch (error) {
      report("escritor o revisor", error);
      return ok(curated);
    }
  };
}
