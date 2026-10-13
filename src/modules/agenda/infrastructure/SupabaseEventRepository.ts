import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import type { EventRepository, UserEvent } from "../domain/UserEvent.js";

interface EventRow {
  id: string;
  user_id: string;
  title: string;
  event_day: string;
  category_ids: string[] | null;
  created_at: string;
}

/** Adaptador real (migraciones 0027 y 0028). Sin test propio: solo mapea filas, como el resto de adaptadores Supabase. */
export class SupabaseEventRepository implements EventRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServiceClient(url, serviceRoleKey);
  }

  async findByUserId(userId: string): Promise<UserEvent[]> {
    const { data, error } = await this.client.from("events").select("id, user_id, title, event_day, category_ids, created_at").eq("user_id", userId);
    if (error) throw new Error(`No se pudieron leer los eventos: ${error.message}`);
    return (data as EventRow[]).map((row) => ({ id: row.id, userId: row.user_id, title: row.title, day: row.event_day, categoryIds: row.category_ids ?? [], createdAt: new Date(row.created_at) }));
  }

  async save(event: UserEvent): Promise<void> {
    const { error } = await this.client
      .from("events")
      .upsert({ id: event.id, user_id: event.userId, title: event.title, event_day: event.day, category_ids: [...event.categoryIds], created_at: event.createdAt.toISOString() });
    if (error) throw new Error(`No se pudo guardar el evento: ${error.message}`);
  }

  async delete(userId: string, eventId: string): Promise<boolean> {
    const { data, error } = await this.client.from("events").delete().eq("user_id", userId).eq("id", eventId).select("id");
    if (error) throw new Error(`No se pudo borrar el evento: ${error.message}`);
    return (data ?? []).length > 0;
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("events").delete().eq("user_id", userId);
    if (error) throw new Error(`No se pudieron borrar los eventos: ${error.message}`);
  }
}
