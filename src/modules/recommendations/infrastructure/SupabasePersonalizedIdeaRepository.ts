import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import type { Locale } from "#shared/domain/locales.js";
import type { PersonalizedIdea, PersonalizedIdeaRepository } from "../domain/PersonalizedIdea.js";

interface PersonalizedIdeaRow {
  recommendation_id: string;
  user_id: string;
  locale: string;
  template_key: string;
  text: string;
  experience_tags: string[];
  model: string;
  created_at: string;
}

function ideaFromRow(row: PersonalizedIdeaRow): PersonalizedIdea {
  return {
    recommendationId: row.recommendation_id,
    userId: row.user_id,
    locale: row.locale as Locale,
    templateKey: row.template_key,
    text: row.text,
    experienceTags: row.experience_tags ?? [],
    model: row.model,
    createdAt: new Date(row.created_at),
  };
}

const COLUMNS = "recommendation_id, user_id, locale, template_key, text, experience_tags, model, created_at";

/** Adaptador real (migraciones 0011 y 0012). Sin test propio: solo mapea filas, como el resto de adaptadores Supabase. */
export class SupabasePersonalizedIdeaRepository implements PersonalizedIdeaRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServiceClient(url, serviceRoleKey);
  }

  async find(recommendationId: string, templateKey: string, locale: Locale): Promise<PersonalizedIdea | undefined> {
    const { data, error } = await this.client
      .from("personalized_ideas")
      .select(COLUMNS)
      .eq("recommendation_id", recommendationId)
      .eq("template_key", templateKey)
      .eq("locale", locale)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la idea personalizada: ${error.message}`);
    return data ? ideaFromRow(data as PersonalizedIdeaRow) : undefined;
  }

  async findByUserId(userId: string): Promise<PersonalizedIdea[]> {
    const { data, error } = await this.client.from("personalized_ideas").select(COLUMNS).eq("user_id", userId);
    if (error) throw new Error(`No se pudieron leer las ideas personalizadas: ${error.message}`);
    return (data as PersonalizedIdeaRow[]).map(ideaFromRow);
  }

  async save(idea: PersonalizedIdea): Promise<void> {
    const { error } = await this.client.from("personalized_ideas").upsert({
      recommendation_id: idea.recommendationId,
      user_id: idea.userId,
      locale: idea.locale,
      template_key: idea.templateKey,
      text: idea.text,
      experience_tags: idea.experienceTags,
      model: idea.model,
      created_at: idea.createdAt.toISOString(),
    }, { onConflict: "recommendation_id,template_key,locale" });
    if (error) throw new Error(`No se pudo guardar la idea personalizada: ${error.message}`);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("personalized_ideas").delete().eq("user_id", userId);
    if (error) throw new Error(`No se pudieron borrar las ideas personalizadas: ${error.message}`);
  }
}
