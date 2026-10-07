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

  async clearNote(userId: string, assessmentId: string): Promise<void> {
    const index = this.assessments.findIndex((a) => a.id === assessmentId && a.userId === userId);
    if (index === -1) return;
    const withoutNote: Assessment = { ...this.assessments[index] };
    delete (withoutNote as { note?: string }).note;
    this.assessments[index] = withoutNote;
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (let i = this.assessments.length - 1; i >= 0; i--) {
      if (this.assessments[i].userId === userId) this.assessments.splice(i, 1);
    }
  }
}
