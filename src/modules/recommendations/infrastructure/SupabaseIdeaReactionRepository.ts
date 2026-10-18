import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import type { IdeaReaction, IdeaReactionKind, IdeaReactionRepository } from "../domain/IdeaReaction.js";

interface IdeaReactionRow {
  user_id: string;
  category_id: string;
  template_key: string;
  reaction: string;
  reacted_at: string;
  planned_for: string | null;
}

/**
 * Adaptador real (migraciones 0024 y 0026). Sin test propio: solo mapea filas, como el
 * resto de adaptadores Supabase.
 */
export class SupabaseIdeaReactionRepository implements IdeaReactionRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServiceClient(url, serviceRoleKey);
  }

  async findByUserId(userId: string): Promise<IdeaReaction[]> {
    const { data, error } = await this.client.from("idea_reactions").select("user_id, category_id, template_key, reaction, reacted_at, planned_for").eq("user_id", userId);
    if (error) throw new Error(`No se pudieron leer las reacciones a las ideas: ${error.message}`);
    return (data as IdeaReactionRow[]).map((row) => ({ userId: row.user_id, categoryId: row.category_id, templateKey: row.template_key, reaction: row.reaction as IdeaReactionKind, reactedAt: new Date(row.reacted_at), ...(row.planned_for ? { plannedFor: row.planned_for } : {}) }));
  }

  async save(reaction: IdeaReaction): Promise<void> {
    const { error } = await this.client
      .from("idea_reactions")
      .upsert({ user_id: reaction.userId, category_id: reaction.categoryId, template_key: reaction.templateKey, reaction: reaction.reaction, reacted_at: reaction.reactedAt.toISOString(), planned_for: reaction.plannedFor ?? null });
    if (error) throw new Error(`No se pudo guardar la reacción a la idea: ${error.message}`);
  }

  async delete(userId: string, categoryId: string, templateKey: string): Promise<void> {
    const { error } = await this.client.from("idea_reactions").delete().eq("user_id", userId).eq("category_id", categoryId).eq("template_key", templateKey);
    if (error) throw new Error(`No se pudo quitar la reacción a la idea: ${error.message}`);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("idea_reactions").delete().eq("user_id", userId);
    if (error) throw new Error(`No se pudieron borrar las reacciones a las ideas: ${error.message}`);
  }
}
