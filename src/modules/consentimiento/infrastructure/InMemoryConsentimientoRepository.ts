import type { Consentimiento } from "../domain/Consentimiento.js";
import type { ConsentimientoRepository } from "../domain/ConsentimientoRepository.js";

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

  async buscarPorUsuario(usuarioId: string): Promise<Consentimiento[]> {
    return this.consentimientos.filter((c) => c.usuarioId === usuarioId);
  }

  async eliminarPorUsuario(usuarioId: string): Promise<void> {
    for (let i = this.consentimientos.length - 1; i >= 0; i--) {
      if (this.consentimientos[i].usuarioId === usuarioId) this.consentimientos.splice(i, 1);
    }
  }
}
