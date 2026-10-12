import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import type { Gender, Profile } from "../domain/Profile.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

interface ProfileRow {
  user_id: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  time_zone: string | null;
  avatar_key: string | null;
  ai_ideas_enabled: boolean | null;
  ai_ideas_enabled_at: string | null;
  ai_suggestions_enabled: boolean | null;
  ai_suggestions_enabled_at: string | null;
}

function profileFromRow(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    name: row.name,
    ...(row.birth_date ? { birthDate: row.birth_date } : {}),
    ...(row.gender ? { gender: row.gender as Gender } : {}),
    ...(row.time_zone ? { timeZone: row.time_zone } : {}),
    ...(row.avatar_key ? { avatarKey: row.avatar_key } : {}),
    aiIdeasEnabled: row.ai_ideas_enabled === true,
    ...(row.ai_ideas_enabled_at ? { aiIdeasEnabledAt: new Date(row.ai_ideas_enabled_at).toISOString() } : {}),
    aiSuggestionsEnabled: row.ai_suggestions_enabled === true,
    ...(row.ai_suggestions_enabled_at ? { aiSuggestionsEnabledAt: new Date(row.ai_suggestions_enabled_at).toISOString() } : {}),
  };
}

/**
 * Adaptador real — usa la service role key (solo en `api/`, nunca en el
 * navegador), igual disciplina que SupabaseAuthProvider. Ver
 * supabase/migrations/0001_profiles.sql para el esquema. Sin test propio:
 * sin lógica más allá de mapear filas ↔ Profile (mismo criterio que
 * SupabaseAuthProvider — el SDK es lo único que hay que confiar aquí).
 */
export class SupabaseProfileRepository implements ProfileRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServiceClient(url, serviceRoleKey);
  }

  async save(profile: Profile): Promise<void> {
    const { error } = await this.client.from("profiles").upsert({
      user_id: profile.userId,
      name: profile.name,
      birth_date: profile.birthDate ?? null,
      gender: profile.gender ?? null,
      time_zone: profile.timeZone ?? null,
      avatar_key: profile.avatarKey ?? null,
      ai_ideas_enabled: profile.aiIdeasEnabled === true,
      ai_ideas_enabled_at: profile.aiIdeasEnabledAt ?? null,
      ai_suggestions_enabled: profile.aiSuggestionsEnabled === true,
      ai_suggestions_enabled_at: profile.aiSuggestionsEnabledAt ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`No se pudo guardar el perfil: ${error.message}`);
    }
  }

  async findByUserId(userId: string): Promise<Profile | undefined> {
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id, name, birth_date, gender, time_zone, avatar_key, ai_ideas_enabled, ai_ideas_enabled_at, ai_suggestions_enabled, ai_suggestions_enabled_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo leer el perfil: ${error.message}`);
    }
    if (!data) return undefined;
    return profileFromRow(data as ProfileRow);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("profiles").delete().eq("user_id", userId);
    if (error) {
      throw new Error(`No se pudo borrar el perfil: ${error.message}`);
    }
  }
}
