import type { Recommendation } from "../domain/Recommendation";
import type { RecommendationRepository } from "../domain/RecommendationRepository";

/** Fake solo para tests — ADR-03 §3.6. En dev/producción: SupabaseRecommendationRepository. */
export class InMemoryRecommendationRepository implements RecommendationRepository {
  private readonly recommendations = new Map<string, Recommendation>();

  async findByUserId(userId: string): Promise<Recommendation[]> {
    return [...this.recommendations.values()].filter((r) => r.userId === userId);
  }

  async saveMany(recommendations: Recommendation[]): Promise<void> {
    for (const r of recommendations) this.recommendations.set(r.id, r);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, r] of this.recommendations) {
      if (r.userId === userId) this.recommendations.delete(id);
    }
  }
}
