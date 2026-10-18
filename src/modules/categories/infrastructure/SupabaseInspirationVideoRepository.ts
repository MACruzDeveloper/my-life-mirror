import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import type { InspirationVideo, InspirationVideoRepository } from "../domain/InspirationVideo.js";

interface VideoRow {
  id: string;
  category_key: string;
  locale: string;
  youtube_id: string;
  title: string;
  created_at: string;
}

/** Un id que no es un uuid no existe (y Postgres respondería con un error, no con "no encontrado"). */
const UUID = /^[0-9a-f-]{36}$/i;
const COLUMNS = "id, category_key, locale, youtube_id, title, created_at";

function fromRow(row: VideoRow): InspirationVideo {
  return { id: row.id, categoryKey: row.category_key, locale: row.locale, youtubeId: row.youtube_id, title: row.title, createdAt: new Date(row.created_at) };
}

/** Adaptador real (migración 0033). Sin test propio: solo mapea filas, como el resto de adaptadores Supabase. */
export class SupabaseInspirationVideoRepository implements InspirationVideoRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServiceClient(url, serviceRoleKey);
  }

  async findAll(): Promise<InspirationVideo[]> {
    const { data, error } = await this.client.from("inspiration_videos").select(COLUMNS).order("created_at");
    if (error) throw new Error(`No se pudieron leer los vídeos: ${error.message}`);
    return (data as VideoRow[]).map(fromRow);
  }

  async findByCategory(categoryKey: string): Promise<InspirationVideo[]> {
    const { data, error } = await this.client.from("inspiration_videos").select(COLUMNS).eq("category_key", categoryKey).order("created_at");
    if (error) throw new Error(`No se pudieron leer los vídeos: ${error.message}`);
    return (data as VideoRow[]).map(fromRow);
  }

  async findById(id: string): Promise<InspirationVideo | undefined> {
    if (!UUID.test(id)) return undefined;
    const { data, error } = await this.client.from("inspiration_videos").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) throw new Error(`No se pudo leer el vídeo: ${error.message}`);
    return data ? fromRow(data as VideoRow) : undefined;
  }

  async save(video: InspirationVideo): Promise<void> {
    const { error } = await this.client.from("inspiration_videos").upsert({
      id: video.id,
      category_key: video.categoryKey,
      locale: video.locale,
      youtube_id: video.youtubeId,
      title: video.title,
      created_at: video.createdAt.toISOString(),
    });
    if (error) throw new Error(`No se pudo guardar el vídeo: ${error.message}`);
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const { data, error } = await this.client.from("inspiration_videos").delete().eq("id", id).select("id");
    if (error) throw new Error(`No se pudo borrar el vídeo: ${error.message}`);
    return (data ?? []).length > 0;
  }
}
