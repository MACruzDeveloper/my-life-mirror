import { type Result, err, ok } from "#shared/domain/Result.js";
import { ValidationError } from "#shared/domain/DomainError.js";
import type { AssessmentRepository } from "#modules/assessments/domain/AssessmentRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { type Recommendation, isOpen } from "../domain/Recommendation.js";
import type { RecommendationRepository } from "../domain/RecommendationRepository.js";

export interface VisibleRecommendation extends Recommendation {
  categoryName: string;
  /** Identidad de la categoría en el catálogo (la interfaz la nombra por aquí). */
  catalogId?: string;
}

interface Dependencies {
  recommendationRepository: RecommendationRepository;
  categoryRepository: CategoryRepository;
  assessmentRepository: AssessmentRepository;
}

/**
 * Caso de uso de solo lectura — las recomendaciones que se enseñan al usuario:
 * abiertas, de categorías activas y cuya última puntuación sigue por debajo del
 * umbral con el que se crearon. Si mejora o desactiva la categoría, desaparecen
 * solas (el registro se conserva). Se filtra al leer en vez de mantener el estado
 * sincronizado al escribir: menos piezas que puedan quedar inconsistentes.
 */
export function createListRecommendations({ recommendationRepository, categoryRepository, assessmentRepository }: Dependencies) {
  return async function listRecommendations(userId: string): Promise<Result<VisibleRecommendation[], ValidationError>> {
    const id = userId.trim();
    if (id.length === 0) return err(new ValidationError("User is required"));

    const [recommendations, categories, assessments] = await Promise.all([
      recommendationRepository.findByUserId(id),
      categoryRepository.findByUserId(id),
      assessmentRepository.findByUserId(id),
    ]);

    const latest = new Map<string, { score: number; at: number }>();
    for (const a of assessments) {
      const actual = latest.get(a.categoryId);
      if (!actual || a.recordedAt.getTime() > actual.at) latest.set(a.categoryId, { score: a.score, at: a.recordedAt.getTime() });
    }
    const activeOnes = new Map(categories.filter((c) => c.status === "active").map((c) => [c.id, c.name]));
    const catalogIds = new Map(categories.filter((c) => c.catalogId).map((c) => [c.id, c.catalogId as string]));

    return ok(
      recommendations
        .filter(isOpen)
        .filter((r) => activeOnes.has(r.categoryId) && (latest.get(r.categoryId)?.score ?? Infinity) < r.threshold)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((r) => ({
          ...r,
          categoryName: activeOnes.get(r.categoryId) as string,
          ...(catalogIds.has(r.categoryId) ? { catalogId: catalogIds.get(r.categoryId) } : {}),
        })),
    );
  };
}
