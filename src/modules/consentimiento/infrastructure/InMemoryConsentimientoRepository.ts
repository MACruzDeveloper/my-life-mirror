import type { Consentimiento } from "../domain/Consentimiento";
import type { ConsentimientoRepository } from "../domain/ConsentimientoRepository";

/**
 * Fake solo para tests — ADR-03 §3.6. En dev/producción se usa
 * SupabaseConsentimientoRepository (04_Almacenamiento_Datos.md §7bis).
 */
export class InMemoryConsentimientoRepository implements ConsentimientoRepository {
  private readonly consentimientos: Consentimiento[] = [];

  async guardar(consentimiento: Consentimiento): Promise<void> {
    this.consentimientos.push(consentimiento);
  }

  async buscar(usuarioId: string, categoriaId: string, versionPolitica: string): Promise<Consentimiento | undefined> {
    return this.consentimientos.find(
      (c) => c.usuarioId === usuarioId && c.categoriaId === categoriaId && c.versionPolitica === versionPolitica,
    );
  }
}
