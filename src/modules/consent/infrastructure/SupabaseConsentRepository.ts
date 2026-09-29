import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Consent } from "../domain/Consent.js";
import type { ConsentRepository } from "../domain/ConsentRepository.js";

interface ConsentRow {
  id: string;
  usuario_id: string;
  categoria_id: string;
  version_politica: string;
  otorgado_en: string;
}

function consentFromRow(row: ConsentRow): Consent {
  return {
    id: row.id,
    userId: row.usuario_id,
    categoryId: row.categoria_id,
    policyVersion: row.version_politica,
    grantedAt: new Date(row.otorgado_en),
  };
}

/**
 * Adaptador real — misma disciplina que SupabaseAuthProvider/
 * SupabaseProfileRepository: service role key, solo en `api/`. Ver
 * supabase/migrations/0002_consentimientos.sql para el esquema (incluye una
 * restricción unique que hace cumplir a nivel de BD la misma idempotencia
 * por versión de política que ya valida OtorgarConsentimiento). Nombrado en
 * español a propósito, igual que el resto de este módulo — no se traduce
 * un archivo suelto dentro de un módulo que sigue siendo Spanish (AGENTS.md,
 * regla "se renombra al tocar", no un pase parcial dentro del mismo módulo).
 */
export class SupabaseConsentRepository implements ConsentRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey);
  }

  async save(consent: Consent): Promise<void> {
    const { error } = await this.client.from("consentimientos").insert({
      id: consent.id,
      usuario_id: consent.userId,
      categoria_id: consent.categoryId,
      version_politica: consent.policyVersion,
      otorgado_en: consent.grantedAt.toISOString(),
    });

    if (error) {
      throw new Error(`No se pudo guardar el consentimiento: ${error.message}`);
    }
  }

  async findUser(userId: string, categoryId: string, policyVersion: string): Promise<Consent | undefined> {
    const { data, error } = await this.client
      .from("consentimientos")
      .select("id, usuario_id, categoria_id, version_politica, otorgado_en")
      .eq("usuario_id", userId)
      .eq("categoria_id", categoryId)
      .eq("version_politica", policyVersion)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo leer el consentimiento: ${error.message}`);
    }
    if (!data) return undefined;
    return consentFromRow(data as ConsentRow);
  }

  async findByUser(userId: string): Promise<Consent[]> {
    const { data, error } = await this.client
      .from("consentimientos")
      .select("id, usuario_id, categoria_id, version_politica, otorgado_en")
      .eq("usuario_id", userId);

    if (error) {
      throw new Error(`No se pudieron leer los consentimientos: ${error.message}`);
    }
    return (data as ConsentRow[]).map(consentFromRow);
  }

  async deleteByUser(userId: string): Promise<void> {
    const { error } = await this.client.from("consentimientos").delete().eq("usuario_id", userId);
    if (error) {
      throw new Error(`No se pudieron borrar los consentimientos: ${error.message}`);
    }
  }
}
