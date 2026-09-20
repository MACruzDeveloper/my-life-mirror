import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/domain/DomainError";
import type { Clock } from "../../../shared/domain/Clock";
import type { CategoryRepository } from "../../categories/domain/CategoryRepository";
import type { Assessment } from "../domain/Assessment";
import type { AssessmentRepository } from "../domain/AssessmentRepository";
import { Score } from "../domain/Score";

const MAX_NOTE_LENGTH = 500;

export interface AssessmentEntry {
  categoryId: string;
  score: number;
  note?: string;
}

export interface RecordAssessmentsInput {
  userId: string;
  entries: AssessmentEntry[];
}

/**
 * Caso de uso — RF-10. Un check-in es una sola acción del usuario, así que
 * es todo o nada: se valida y se comprueba cada categoría primero y solo
 * entonces se guarda con `saveMany` — nunca un check-in a medias. Admite
 * check-ins parciales (no exige puntuar *todas* las activas; eso lo obliga
 * la pantalla) porque RF-09 (frecuencia por categoría) los necesitará. Ver
 * docs/user-stories/RF-10-entrevista.md.
 */
export function createRecordAssessments(
  assessmentRepository: AssessmentRepository,
  categoryRepository: CategoryRepository,
  clock: Clock,
  /**
   * Oyente opcional, avisado DESPUÉS de persistir (RF-18: recomendaciones). Es
   * el equivalente en proceso del evento de dominio del ADR-03 §3.4, sin Outbox.
   * Es secundario: quien lo cablea es responsable de capturar sus propios
   * fallos; aquí, si aun así lanza, no se deshace un guardado ya hecho.
   */
  onRecorded?: (userId: string, assessments: Assessment[]) => Promise<unknown>,
) {
  return async function recordAssessments(
    input: RecordAssessmentsInput,
  ): Promise<Result<Assessment[], ValidationError | NotFoundError | ConflictError>> {
    const userId = input.userId.trim();
    if (userId.length === 0) return err(new ValidationError("User is required"));
    if (input.entries.length === 0) return err(new ValidationError("At least one score is required"));

    const seen = new Set<string>();
    const validated: { categoryId: string; score: Score; note?: string }[] = [];

    for (const entry of input.entries) {
      const categoryId = entry.categoryId.trim();
      if (categoryId.length === 0) return err(new ValidationError("Category is required"));
      if (seen.has(categoryId)) return err(new ValidationError("Each category can be scored only once per check-in"));
      seen.add(categoryId);

      const score = Score.create(entry.score);
      if (!score.ok) return err(score.error);

      const note = entry.note?.trim();
      if (note !== undefined && note.length > MAX_NOTE_LENGTH) {
        return err(new ValidationError(`Note cannot exceed ${MAX_NOTE_LENGTH} characters`));
      }

      validated.push({ categoryId, score: score.value, ...(note ? { note } : {}) });
    }

    for (const entry of validated) {
      const category = await categoryRepository.findById(userId, entry.categoryId);
      if (!category) return err(new NotFoundError("Category not found"));
      if (category.status !== "active") return err(new ConflictError("Only active categories can be scored"));
    }

    const recordedAt = clock.now();
    const assessments: Assessment[] = validated.map((entry) => ({
      id: randomUUID(),
      userId,
      categoryId: entry.categoryId,
      score: entry.score.value,
      ...(entry.note ? { note: entry.note } : {}),
      recordedAt,
    }));

    await assessmentRepository.saveMany(assessments);
    try {
      await onRecorded?.(userId, assessments);
    } catch {
      // El guardado ya es firme; ver la nota de `onRecorded`.
    }
    return ok(assessments);
  };
}
