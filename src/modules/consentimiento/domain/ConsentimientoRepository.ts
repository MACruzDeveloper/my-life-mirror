import type { Consentimiento } from "./Consentimiento";

/**
 * Puerto — ADR-03 §3.3. `versionPolitica` forma parte de la clave de
 * búsqueda a propósito: un consentimiento otorgado bajo una política antigua
 * no cuenta como válido si la política cambia de versión (RD-05).
 */
export interface ConsentimientoRepository {
  guardar(consentimiento: Consentimiento): Promise<void>;
  buscar(usuarioId: string, categoriaId: string, versionPolitica: string): Promise<Consentimiento | undefined>;
}
