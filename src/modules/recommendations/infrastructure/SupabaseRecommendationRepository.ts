import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Recommendation, RecommendationStatus } from "../domain/Recommendation";
import type { RecommendationRepository } from "../domain/RecommendationRepository";

interface FilaRecomendacion {
  id: string;
  user_id: string;
  category_id: string;
  template_key: string;
  threshold: number;
  status: string;
  created_at: string;
}

const COLUMNAS = "id, user_id, category_id, template_key, threshold, status, created_at";

/** Adaptador real (supabase/migrations/0007_recommendations.sql). Sin test propio: solo mapea filas. */
export class SupabaseRecommendationRepository implements RecommendationRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey);
  }

  async findByUserId(userId: string): Promise<Recommendation[]> {
    const { data, error } = await this.client.from("recommendations").select(COLUMNAS).eq("user_id", userId);
    if (error) throw new Error(`No se pudieron leer las recomendaciones: ${error.message}`);
    return (data as FilaRecomendacion[]).map((f) => ({
      id: f.id,
      userId: f.user_id,
      categoryId: f.category_id,
      templateKey: f.template_key,
      threshold: f.threshold,
      status: f.status as RecommendationStatus,
      createdAt: new Date(f.created_at),
    }));
  }

  async saveMany(recommendations: Recommendation[]): Promise<void> {
    if (recommendations.length === 0) return;
    const { error } = await this.client.from("recommendations").upsert(
      recommendations.map((r) => ({
        id: r.id,
        user_id: r.userId,
        category_id: r.categoryId,
        template_key: r.templateKey,
        threshold: r.threshold,
        status: r.status,
        created_at: r.createdAt.toISOString(),
      })),
    );
    if (error) throw new Error(`No se pudieron guardar las recomendaciones: ${error.message}`);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("recommendations").delete().eq("user_id", userId);
    if (error) throw new Error(`No se pudieron borrar las recomendaciones: ${error.message}`);
  }
}
