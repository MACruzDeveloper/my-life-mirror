import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { ValidationError } from "../../../shared/domain/DomainError.js";
import type { CategoryRepository } from "../../categories/domain/CategoryRepository.js";
import type { AssessmentRepository } from "../domain/AssessmentRepository.js";

export interface LatestScore {
  categoryId: string;
  categoryName: string;
  /** Identidad de la categoría en el catálogo: la interfaz la nombra por aquí, en cada idioma. */
  catalogId?: string;
  /** `undefined` = todavía sin puntuar. */
  score?: number;
  note?: string;
  recordedAt?: Date;
}

/**
 * Caso de uso de solo lectura — la pantalla "Resultados": la última
 * puntuación de cada categoría activa. Es el mínimo para poder *ver* lo
 * registrado; el panel completo (tendencias, recomendaciones) es RF-14.
 * Calcula el "último" aquí (no en el repositorio) porque el volumen del MVP
 * es pequeño — si crece, se mueve a una consulta del repositorio.
 */
export function createGetLatestScores(assessmentRepository: AssessmentRepository, categoryRepository: CategoryRepository) {
  return async function getLatestScores(userId: string): Promise<Result<LatestScore[], ValidationError>> {
    const id = userId.trim();
    if (id.length === 0) return err(new ValidationError("User is required"));

    const [categories, assessments] = await Promise.all([
      categoryRepository.findByUserId(id),
      assessmentRepository.findByUserId(id),
    ]);

    const latestByCategory = new Map<string, (typeof assessments)[number]>();
    for (const assessment of assessments) {
      const current = latestByCategory.get(assessment.categoryId);
      if (!current || assessment.recordedAt > current.recordedAt) {
        latestByCategory.set(assessment.categoryId, assessment);
      }
    }

    return ok(
      categories
        .filter((category) => category.status === "active")
        .map((category) => {
          const latest = latestByCategory.get(category.id);
          return {
            categoryId: category.id,
            categoryName: category.name,
            ...(category.catalogId ? { catalogId: category.catalogId } : {}),
            ...(latest
              ? { score: latest.score, ...(latest.note ? { note: latest.note } : {}), recordedAt: latest.recordedAt }
              : {}),
          };
        }),
    );
  };
}
