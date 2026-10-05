import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Experience, ExperienceRepository } from "../domain/Experience.js";

interface ExperienceRow {
  id: string;
  user_id: string;
  category_id: string;
  text: string;
  created_at: string;
}

function experienceFromRow(row: ExperienceRow): Experience {
  return { id: row.id, userId: row.user_id, categoryId: row.category_id, text: row.text, createdAt: new Date(row.created_at) };
}

const COLUMNS = "id, user_id, category_id, text, created_at";

/** Adaptador real (migración 0014). Sin test propio: solo mapea filas, como el resto de adaptadores Supabase. */
export class SupabaseExperienceRepository implements ExperienceRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey);
  }

  async findByUserId(userId: string): Promise<Experience[]> {
    const { data, error } = await this.client.from("experiences").select(COLUMNS).eq("user_id", userId);
    if (error) throw new Error(`No se pudieron leer las experiencias: ${error.message}`);
    return (data as ExperienceRow[]).map(experienceFromRow);
  }

  async save(experience: Experience): Promise<void> {
    const { error } = await this.client.from("experiences").upsert({
      id: experience.id,
      user_id: experience.userId,
      category_id: experience.categoryId,
      text: experience.text,
      created_at: experience.createdAt.toISOString(),
    });
    if (error) throw new Error(`No se pudo guardar la experiencia: ${error.message}`);
  }

  async delete(userId: string, experienceId: string): Promise<boolean> {
    const { data, error } = await this.client.from("experiences").delete().eq("id", experienceId).eq("user_id", userId).select("id");
    if (error) throw new Error(`No se pudo borrar la experiencia: ${error.message}`);
    return (data ?? []).length > 0;
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("experiences").delete().eq("user_id", userId);
    if (error) throw new Error(`No se pudieron borrar las experiencias: ${error.message}`);
  }
}
