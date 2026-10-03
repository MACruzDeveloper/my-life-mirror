import { type Result, err, ok } from "#shared/domain/Result.js";
import { ValidationError } from "#shared/domain/DomainError.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import type { AssessmentRepository } from "../domain/AssessmentRepository.js";

export interface HistoryEntry {
  categoryId: string;
  categoryName: string;
  /** Identidad de la categoría en el catálogo (la interfaz la nombra por aquí). */
  catalogId?: string;
  score: number;
  /** Puntuación inmediatamente anterior de esa categoría; `undefined` si es la primera. */
  previousScore?: number;
  note?: string;
}

/** Un guardado del usuario: todas las evaluaciones con el mismo `recordedAt` (ver RecordAssessments). */
export interface HistorySession {
  recordedAt: Date;
  entries: HistoryEntry[];
}

/**
 * Caso de uso de solo lectura — el registro de cambios que ve el usuario
 * junto a la entrevista ("en enero puntuaste esto, en septiembre lo
 * modificaste"). No es el panel de evolución (RF-14, gráficos): solo una
 * lista. Agrupa por `recordedAt` porque cada guardado comparte ese instante,
 * y busca los nombres en todas las categorías del usuario, también las
 * desactivadas, para que el historial no pierda información.
 */
export function createGetAssessmentHistory(assessmentRepository: AssessmentRepository, categoryRepository: CategoryRepository) {
  return async function getAssessmentHistory(userId: string): Promise<Result<HistorySession[], ValidationError>> {
    const id = userId.trim();
    if (id.length === 0) return err(new ValidationError("User is required"));

    const [categories, assessments] = await Promise.all([
      categoryRepository.findByUserId(id),
      assessmentRepository.findByUserId(id),
    ]);
    const names = new Map(categories.map((c) => [c.id, c.name]));
    const catalogIds = new Map(categories.filter((c) => c.catalogId).map((c) => [c.id, c.catalogId as string]));

    const ascending = [...assessments].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
    const previousByCategory = new Map<string, number>();
    const sessions = new Map<number, HistorySession>();

    for (const assessment of ascending) {
      const key = assessment.recordedAt.getTime();
      const session = sessions.get(key) ?? { recordedAt: assessment.recordedAt, entries: [] };
      const previousScore = previousByCategory.get(assessment.categoryId);
      session.entries.push({
        categoryId: assessment.categoryId,
        categoryName: names.get(assessment.categoryId) ?? "",
        ...(catalogIds.has(assessment.categoryId) ? { catalogId: catalogIds.get(assessment.categoryId) } : {}),
        score: assessment.score,
        ...(previousScore !== undefined ? { previousScore } : {}),
        ...(assessment.note ? { note: assessment.note } : {}),
      });
      sessions.set(key, session);
      previousByCategory.set(assessment.categoryId, assessment.score);
    }

    return ok([...sessions.values()].reverse());
  };
}
