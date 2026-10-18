import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import type { Trip, TripRepository } from "../domain/Trip.js";

interface TripRow {
  id: string;
  user_id: string;
  country_code: string;
  trip_year: number;
  trip_month: number | null;
  created_at: string;
}

/** Adaptador real (migraciones 0029 y 0030). Sin test propio: solo mapea filas, como el resto de adaptadores Supabase. */
export class SupabaseTripRepository implements TripRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServiceClient(url, serviceRoleKey);
  }

  async findByUserId(userId: string): Promise<Trip[]> {
    const { data, error } = await this.client.from("trips").select("id, user_id, country_code, trip_year, trip_month, created_at").eq("user_id", userId);
    if (error) throw new Error(`No se pudieron leer los viajes: ${error.message}`);
    return (data as TripRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      countryCode: row.country_code,
      year: row.trip_year,
      ...(row.trip_month !== null ? { month: row.trip_month } : {}),
      createdAt: new Date(row.created_at),
    }));
  }

  async save(trip: Trip): Promise<void> {
    const { error } = await this.client
      .from("trips")
      .upsert({ id: trip.id, user_id: trip.userId, country_code: trip.countryCode, trip_year: trip.year, trip_month: trip.month ?? null, created_at: trip.createdAt.toISOString() });
    if (error) throw new Error(`No se pudo guardar el viaje: ${error.message}`);
  }

  async delete(userId: string, tripId: string): Promise<boolean> {
    const { data, error } = await this.client.from("trips").delete().eq("user_id", userId).eq("id", tripId).select("id");
    if (error) throw new Error(`No se pudo borrar el viaje: ${error.message}`);
    return (data ?? []).length > 0;
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("trips").delete().eq("user_id", userId);
    if (error) throw new Error(`No se pudieron borrar los viajes: ${error.message}`);
  }
}
