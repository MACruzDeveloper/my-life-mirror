import type { Milestone, MilestoneRepository } from "../domain/Milestone.js";

/** Fake para tests — ADR-03 apartado 3.6. En desarrollo y producción, `SupabaseMilestoneRepository`. */
export class InMemoryMilestoneRepository implements MilestoneRepository {
  private readonly milestones = new Map<string, Milestone>();

  async findByUserId(userId: string): Promise<Milestone[]> {
    return [...this.milestones.values()].filter((milestone) => milestone.userId === userId);
  }

  async save(milestone: Milestone): Promise<void> {
    this.milestones.set(milestone.id, milestone);
  }

  async delete(userId: string, milestoneId: string): Promise<boolean> {
    if (this.milestones.get(milestoneId)?.userId !== userId) return false;
    return this.milestones.delete(milestoneId);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, milestone] of this.milestones) {
      if (milestone.userId === userId) this.milestones.delete(id);
    }
  }
}
