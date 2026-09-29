import type { Assessment } from "./Assessment.js";

/**
 * Puerto — ADR-03 apartado 3.3. Solo inserta (RF-12: registro inmutable); la única
 * forma de quitar evaluaciones es `deleteByUserId`, para el derecho al olvido
 * (RF-05), que prevalece sobre la inmutabilidad.
 */
export interface AssessmentRepository {
  saveMany(assessments: Assessment[]): Promise<void>;
  findByUserId(userId: string): Promise<Assessment[]>;
  /** Borra todas las evaluaciones del usuario (RF-05). Repetible: no falla si ya no hay ninguna. */
  deleteByUserId(userId: string): Promise<void>;
}
