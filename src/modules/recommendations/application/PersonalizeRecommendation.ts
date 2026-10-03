import { type Result, err, ok } from "#shared/domain/Result.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import type { Clock } from "#shared/domain/Clock.js";
import { isSupportedLocale, type Locale } from "#shared/domain/locales.js";
import type { ProfileRepository } from "#modules/accounts/domain/ProfileRepository.js";
import type { AssessmentRepository } from "#modules/assessments/domain/AssessmentRepository.js";
import type { CategoryCatalogRepository } from "#modules/categories/domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import type { IdeaRequest, IdeaReviewer, IdeaTrend, IdeaWriter } from "../domain/IdeaWriter.js";
import type { IdeaTexts } from "../domain/IdeaTexts.js";
import { checkIdeaSafety } from "../domain/ideaSafety.js";
import type { PersonalizedIdeaRepository } from "../domain/PersonalizedIdea.js";
import { isOpen } from "../domain/Recommendation.js";
import type { RecommendationRepository } from "../domain/RecommendationRepository.js";

export interface PersonalizeRecommendationInput {
  userId: string;
  recommendationId: string;
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
}

function trendOf(scores: number[]): IdeaTrend {
  if (scores.length < 2) return "first";
  const [latest, previous] = scores;
  return latest > previous ? "up" : latest < previous ? "down" : "steady";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Tiempo agotado (${ms} ms)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Caso de uso — RF-40 (ver la historia RF-40, Nivel 3, que manda sobre este código).
 * La IA solo reescribe una idea del catálogo de esa categoría; cualquier duda
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
    const curated: PersonalizedResult = { source: "catalog", templateKey: recommendation.templateKey };

    if (!writer || !isOpen(recommendation)) return ok(curated);
    const profile = await profileRepository.findByUserId(input.userId);
    if (profile?.aiIdeasEnabled !== true) return ok(curated);

    const category = await categoryRepository.findById(input.userId, recommendation.categoryId);
    if (!category || category.isSensitiveData) return ok(curated);
    const categoryKey = (await catalog.findAll()).find((entry) => entry.id === category.catalogId)?.key;
    if (!categoryKey) return ok(curated);

    const saved = await personalizedIdeaRepository.find(recommendation.id, locale);
    if (saved) return ok({ source: "ai", templateKey: saved.templateKey, text: saved.text });

    const scores = (await assessmentRepository.findByUserId(input.userId))
      .filter((assessment) => assessment.categoryId === category.id)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .map((assessment) => assessment.score);
    const candidates = ideaTexts.candidatesFor(categoryKey, locale);
    if (scores.length === 0 || candidates.length === 0) return ok(curated);

    const request: IdeaRequest = {
      locale,
      categoryKey,
      score: scores[0],
      trend: trendOf(scores),
      helpfulThings: ideaTexts.experienceLabels(category.experienceTags ?? [], locale),
      candidates,
    };

    try {
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
      await personalizedIdeaRepository.save({ recommendationId: recommendation.id, userId: input.userId, locale, templateKey: draft.templateKey, text: draft.text.trim(), model: writer.model, createdAt: clock.now() });
      return ok({ source: "ai", templateKey: draft.templateKey, text: draft.text.trim() });
    } catch (error) {
      report("escritor o revisor", error);
      return ok(curated);
    }
  };
}
