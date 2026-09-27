import type { AdminAuditEntry } from "./AdminAuditEntry.js";

/** Puerto — solo añade y lee: una anotación de auditoría nunca se edita ni se borra (OWASP A09). */
export interface AdminAuditRepository {
  add(entry: AdminAuditEntry): Promise<void>;
  /** Las últimas `limit` anotaciones, la más reciente primero. */
  findRecent(limit: number): Promise<AdminAuditEntry[]>;
}
