import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Gender, Profile } from "../domain/Profile";
import type { ProfileRepository } from "../domain/ProfileRepository";

interface FilaPerfil {
  user_id: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  time_zone: string | null;
}

function perfilDesdeFila(fila: FilaPerfil): Profile {
  return {
    userId: fila.user_id,
    name: fila.name,
    ...(fila.birth_date ? { birthDate: fila.birth_date } : {}),
    ...(fila.gender ? { gender: fila.gender as Gender } : {}),
    ...(fila.time_zone ? { timeZone: fila.time_zone } : {}),
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
  private readonly cliente: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.cliente = createClient(url, serviceRoleKey);
  }

  async save(profile: Profile): Promise<void> {
    const { error } = await this.cliente.from("profiles").upsert({
      user_id: profile.userId,
      name: profile.name,
      birth_date: profile.birthDate ?? null,
      gender: profile.gender ?? null,
      time_zone: profile.timeZone ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`No se pudo guardar el perfil: ${error.message}`);
    }
  }

  async findByUserId(userId: string): Promise<Profile | undefined> {
    const { data, error } = await this.cliente
      .from("profiles")
      .select("user_id, name, birth_date, gender, time_zone")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo leer el perfil: ${error.message}`);
    }
    if (!data) return undefined;
    return perfilDesdeFila(data as FilaPerfil);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.cliente.from("profiles").delete().eq("user_id", userId);
    if (error) {
      throw new Error(`No se pudo borrar el perfil: ${error.message}`);
    }
  }
}
