import type { Assessment } from "../domain/Assessment";
import type { AssessmentRepository } from "../domain/AssessmentRepository";

/** Fake solo para tests — ADR-03 §3.6. En dev/producción: SupabaseAssessmentRepository. */
export class InMemoryAssessmentRepository implements AssessmentRepository {
  private readonly assessments: Assessment[] = [];

  async saveMany(assessments: Assessment[]): Promise<void> {
    this.assessments.push(...assessments);
  }

  async findByUserId(userId: string): Promise<Assessment[]> {
    return this.assessments.filter((a) => a.userId === userId);
  }
}
