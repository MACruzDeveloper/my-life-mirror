import type { AdminAuditEntry } from "../domain/AdminAuditEntry.js";
import type { AdminAuditRepository } from "../domain/AdminAuditRepository.js";

/** Fake solo para tests — ADR-03 §3.6. En dev/producción: SupabaseAdminAuditRepository. */
export class InMemoryAdminAuditRepository implements AdminAuditRepository {
  private readonly entries: AdminAuditEntry[] = [];

  async add(entry: AdminAuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  async findRecent(limit: number): Promise<AdminAuditEntry[]> {
    return [...this.entries].reverse().slice(0, limit);
  }
}
