import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Assessment } from "../domain/Assessment.js";
import type { AssessmentRepository } from "../domain/AssessmentRepository.js";

interface AssessmentRow {
  id: string;
  user_id: string;
  category_id: string;
  score: number;
  note: string | null;
  recorded_at: string;
}

function toAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    score: row.score,
    ...(row.note ? { note: row.note } : {}),
    recordedAt: new Date(row.recorded_at),
  };
}

/**
 * Adaptador real — service role key, solo en `api/` (igual disciplina que
 * el resto de adaptadores Supabase). Esquema en
 * supabase/migrations/0004_assessments.sql. Solo inserta: RF-12 (registro
 * inmutable). Sin test propio: sin lógica más allá de mapear filas.
 */
export class SupabaseAssessmentRepository implements AssessmentRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey);
  }

  async saveMany(assessments: Assessment[]): Promise<void> {
    if (assessments.length === 0) return;
    const { error } = await this.client.from("assessments").insert(
      assessments.map((a) => ({
        id: a.id,
        user_id: a.userId,
        category_id: a.categoryId,
        score: a.score,
        note: a.note ?? null,
        recorded_at: a.recordedAt.toISOString(),
      })),
    );
    if (error) throw new Error(`No se pudieron guardar las evaluaciones: ${error.message}`);
  }

  async findByUserId(userId: string): Promise<Assessment[]> {
    const { data, error } = await this.client
      .from("assessments")
      .select("id, user_id, category_id, score, note, recorded_at")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false });
    if (error) throw new Error(`No se pudieron leer las evaluaciones: ${error.message}`);
    return (data as AssessmentRow[]).map(toAssessment);
  }

  async clearNote(userId: string, assessmentId: string): Promise<void> {
    const { error } = await this.client.from("assessments").update({ note: null }).eq("id", assessmentId).eq("user_id", userId);
    if (error) throw new Error(`No se pudo vaciar la nota de la evaluación: ${error.message}`);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("assessments").delete().eq("user_id", userId);
    if (error) throw new Error(`No se pudieron borrar las evaluaciones: ${error.message}`);
  }
}
