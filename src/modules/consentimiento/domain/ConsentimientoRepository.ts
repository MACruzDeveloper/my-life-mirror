import type { Consentimiento } from "./Consentimiento.js";

/**
 * Puerto — ADR-03 §3.3. `versionPolitica` forma parte de la clave de
 * búsqueda a propósito: un consentimiento otorgado bajo una política antigua
 * no cuenta como válido si la política cambia de versión (RD-05).
 */
export interface ConsentimientoRepository {
  guardar(consentimiento: Consentimiento): Promise<void>;
  /** Todos los consentimientos del usuario (RF-05, exportación). */
  buscarPorUsuario(usuarioId: string): Promise<Consentimiento[]>;
  /** Borra todos los consentimientos del usuario (RF-05). Repetible. */
  eliminarPorUsuario(usuarioId: string): Promise<void>;
  buscar(usuarioId: string, categoriaId: string, versionPolitica: string): Promise<Consentimiento | undefined>;
}
