import type { Assessment } from "./Assessment";

/** Puerto — ADR-03 §3.3. Solo inserta (RF-12: registro inmutable). */
export interface AssessmentRepository {
  saveMany(assessments: Assessment[]): Promise<void>;
  findByUserId(userId: string): Promise<Assessment[]>;
}
