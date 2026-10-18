import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import type { Milestone, MilestoneCategory, MilestoneRepository } from "../domain/Milestone.js";

interface MilestoneRow {
  id: string;
  user_id: string;
  category_key: MilestoneCategory;
  title: string;
  milestone_year: number;
  milestone_month: number | null;
  created_at: string;
}

/** Adaptador real (migración 0031). Sin test propio: solo mapea filas, como el resto de adaptadores Supabase. */
export class SupabaseMilestoneRepository implements MilestoneRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServiceClient(url, serviceRoleKey);
  }

  async findByUserId(userId: string): Promise<Milestone[]> {
    const { data, error } = await this.client.from("milestones").select("id, user_id, category_key, title, milestone_year, milestone_month, created_at").eq("user_id", userId);
    if (error) throw new Error(`No se pudieron leer los hitos: ${error.message}`);
    return (data as MilestoneRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      categoryKey: row.category_key,
      title: row.title,
      year: row.milestone_year,
      ...(row.milestone_month !== null ? { month: row.milestone_month } : {}),
      createdAt: new Date(row.created_at),
    }));
  }

  async save(milestone: Milestone): Promise<void> {
    const { error } = await this.client.from("milestones").upsert({
      id: milestone.id,
      user_id: milestone.userId,
      category_key: milestone.categoryKey,
      title: milestone.title,
      milestone_year: milestone.year,
      milestone_month: milestone.month ?? null,
      created_at: milestone.createdAt.toISOString(),
    });
    if (error) throw new Error(`No se pudo guardar el hito: ${error.message}`);
  }

  async delete(userId: string, milestoneId: string): Promise<boolean> {
    const { data, error } = await this.client.from("milestones").delete().eq("user_id", userId).eq("id", milestoneId).select("id");
    if (error) throw new Error(`No se pudo borrar el hito: ${error.message}`);
    return (data ?? []).length > 0;
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("milestones").delete().eq("user_id", userId);
    if (error) throw new Error(`No se pudieron borrar los hitos: ${error.message}`);
  }
}
