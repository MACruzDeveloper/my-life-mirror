import type { Assessment } from "./Assessment.js";

/**
 * Puerto — ADR-03 apartado 3.3. Solo inserta (RF-12: registro inmutable); la única
 * forma de quitar evaluaciones es `deleteByUserId`, para el derecho al olvido
 * (RF-05), que prevalece sobre la inmutabilidad.
 */
export interface AssessmentRepository {
  saveMany(assessments: Assessment[]): Promise<void>;
  findByUserId(userId: string): Promise<Assessment[]>;
  /**
   * Vacía la nota de una evaluación del usuario, sin tocar la puntuación ni la fecha. Otra excepción a
   * RF-12, como `deleteByUserId`: al borrar del diario una experiencia que venía de esa nota (RF-44), el
   * derecho al olvido prevalece. Nada si no existe o es de otro usuario.
   */
  clearNote(userId: string, assessmentId: string): Promise<void>;
  /** Borra todas las evaluaciones del usuario (RF-05). Repetible: no falla si ya no hay ninguna. */
  deleteByUserId(userId: string): Promise<void>;
}
