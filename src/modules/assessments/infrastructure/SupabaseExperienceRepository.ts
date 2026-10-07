import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "#shared/domain/locales.js";
import type { Experience, ExperienceRepository, SharedExperience } from "../domain/Experience.js";

interface ExperienceRow {
  id: string;
  user_id: string;
  category_id: string;
  text: string;
  created_at: string;
  shared_at: string | null;
  shared_locale: Locale | null;
  shared_category_key: string | null;
  reported_at: string | null;
  source_assessment_id: string | null;
}

function experienceFromRow(row: ExperienceRow): Experience {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    text: row.text,
    createdAt: new Date(row.created_at),
    ...(row.shared_at && { sharedAt: new Date(row.shared_at) }),
    ...(row.shared_locale && { sharedLocale: row.shared_locale }),
    ...(row.shared_category_key && { sharedCategoryKey: row.shared_category_key }),
    ...(row.reported_at && { reportedAt: new Date(row.reported_at) }),
    ...(row.source_assessment_id && { sourceAssessmentId: row.source_assessment_id }),
  };
}

const COLUMNS = "id, user_id, category_id, text, created_at, shared_at, shared_locale, shared_category_key, reported_at, source_assessment_id";

/** Adaptador real (migraciones 0014 y 0017). Sin test propio: solo mapea filas, como el resto de adaptadores Supabase. */
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
      shared_at: experience.sharedAt?.toISOString() ?? null,
      shared_locale: experience.sharedLocale ?? null,
      shared_category_key: experience.sharedCategoryKey ?? null,
      reported_at: experience.reportedAt?.toISOString() ?? null,
      // Solo si la tiene: así nunca se borra el enlace con la nota de origen al guardar.
      ...(experience.sourceAssessmentId && { source_assessment_id: experience.sourceAssessmentId }),
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

  async findShared({ categoryKey, locale, excludeUserId, limit }: { categoryKey: string; locale: Locale; excludeUserId: string; limit: number }): Promise<SharedExperience[]> {
    // Solo id y texto: a quien lee nunca le llegan el usuario ni las fechas.
    const { data, error } = await this.client
      .from("experiences")
      .select("id, text")
      .eq("shared_category_key", categoryKey)
      .eq("shared_locale", locale)
      .neq("user_id", excludeUserId)
      .not("shared_at", "is", null)
      .is("reported_at", null)
      .order("shared_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`No se pudieron leer las experiencias compartidas: ${error.message}`);
    return (data as SharedExperience[]).map(({ id, text }) => ({ id, text }));
  }

  async report(experienceId: string, reporterId: string, at: Date): Promise<boolean> {
    const { data, error } = await this.client
      .from("experiences")
      .update({ reported_at: at.toISOString() })
      .eq("id", experienceId)
      .neq("user_id", reporterId)
      .not("shared_at", "is", null)
      .is("reported_at", null)
      .select("id");
    if (error) throw new Error(`No se pudo reportar la experiencia: ${error.message}`);
    return (data ?? []).length > 0;
  }
}
