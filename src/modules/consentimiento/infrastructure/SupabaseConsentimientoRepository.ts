import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Consentimiento } from "../domain/Consentimiento";
import type { ConsentimientoRepository } from "../domain/ConsentimientoRepository";

interface FilaConsentimiento {
  id: string;
  usuario_id: string;
  categoria_id: string;
  version_politica: string;
  otorgado_en: string;
}

function consentimientoDesdeFila(fila: FilaConsentimiento): Consentimiento {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    categoriaId: fila.categoria_id,
    versionPolitica: fila.version_politica,
    otorgadoEn: new Date(fila.otorgado_en),
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
export class SupabaseConsentimientoRepository implements ConsentimientoRepository {
  private readonly cliente: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.cliente = createClient(url, serviceRoleKey);
  }

  async guardar(consentimiento: Consentimiento): Promise<void> {
    const { error } = await this.cliente.from("consentimientos").insert({
      id: consentimiento.id,
      usuario_id: consentimiento.usuarioId,
      categoria_id: consentimiento.categoriaId,
      version_politica: consentimiento.versionPolitica,
      otorgado_en: consentimiento.otorgadoEn.toISOString(),
    });

    if (error) {
      throw new Error(`No se pudo guardar el consentimiento: ${error.message}`);
    }
  }

  async buscar(usuarioId: string, categoriaId: string, versionPolitica: string): Promise<Consentimiento | undefined> {
    const { data, error } = await this.cliente
      .from("consentimientos")
      .select("id, usuario_id, categoria_id, version_politica, otorgado_en")
      .eq("usuario_id", usuarioId)
      .eq("categoria_id", categoriaId)
      .eq("version_politica", versionPolitica)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo leer el consentimiento: ${error.message}`);
    }
    if (!data) return undefined;
    return consentimientoDesdeFila(data as FilaConsentimiento);
  }
}
