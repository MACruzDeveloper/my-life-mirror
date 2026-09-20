import type { Recommendation } from "./Recommendation";

/** Puerto — ADR-03 §3.3. `saveMany` es upsert por id (así RF-19 podrá cambiar el estado). */
export interface RecommendationRepository {
  findByUserId(userId: string): Promise<Recommendation[]>;
  saveMany(recommendations: Recommendation[]): Promise<void>;
  /** Borra todas las del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
