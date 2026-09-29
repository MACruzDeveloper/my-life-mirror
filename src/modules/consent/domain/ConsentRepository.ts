import type { Consent } from "./Consent.js";

/**
 * Puerto — ADR-03 apartado 3.3. `versionPolitica` forma parte de la clave de
 * búsqueda a propósito: un consentimiento otorgado bajo una política antigua
 * no cuenta como válido si la política cambia de versión (RD-05).
 */
export interface ConsentRepository {
  save(consent: Consent): Promise<void>;
  /** Todos los consentimientos del usuario (RF-05, exportación). */
  findByUser(userId: string): Promise<Consent[]>;
  /** Borra todos los consentimientos del usuario (RF-05). Repetible. */
  deleteByUser(userId: string): Promise<void>;
  findUser(userId: string, categoryId: string, policyVersion: string): Promise<Consent | undefined>;
}
