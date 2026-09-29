import type { Assessment } from "../domain/Assessment.js";
import type { AssessmentRepository } from "../domain/AssessmentRepository.js";

/** Fake solo para tests — ADR-03 apartado 3.6. En dev/producción: SupabaseAssessmentRepository. */
export class InMemoryAssessmentRepository implements AssessmentRepository {
  private readonly assessments: Assessment[] = [];

  async saveMany(assessments: Assessment[]): Promise<void> {
    this.assessments.push(...assessments);
  }

  async findByUserId(userId: string): Promise<Assessment[]> {
    return this.assessments.filter((a) => a.userId === userId);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (let i = this.assessments.length - 1; i >= 0; i--) {
      if (this.assessments[i].userId === userId) this.assessments.splice(i, 1);
    }
  }
}
