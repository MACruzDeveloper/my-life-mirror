import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AdminAuditEntry } from "../domain/AdminAuditEntry";
import type { AdminAuditRepository } from "../domain/AdminAuditRepository";

interface FilaAuditoria {
  id: string;
  actor_id: string;
  action: string;
  target_id: string | null;
  detail: string | null;
  occurred_at: string;
}

/** Adaptador real (supabase/migrations/0006_admin_audit_log.sql). Sin test propio: solo mapea filas. */
export class SupabaseAdminAuditRepository implements AdminAuditRepository {
  private readonly cliente: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.cliente = createClient(url, serviceRoleKey);
  }

  async add(entry: AdminAuditEntry): Promise<void> {
    const { error } = await this.cliente.from("admin_audit_log").insert({
      id: entry.id,
      actor_id: entry.actorId,
      action: entry.action,
      target_id: entry.targetId ?? null,
      detail: entry.detail ?? null,
      occurred_at: entry.occurredAt.toISOString(),
    });
    if (error) throw new Error(`No se pudo anotar la auditoría: ${error.message}`);
  }

  async findRecent(limit: number): Promise<AdminAuditEntry[]> {
    const { data, error } = await this.cliente
      .from("admin_audit_log")
      .select("id, actor_id, action, target_id, detail, occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`No se pudo leer la auditoría: ${error.message}`);
    return (data as FilaAuditoria[]).map((f) => ({
      id: f.id,
      actorId: f.actor_id,
      action: f.action,
      ...(f.target_id ? { targetId: f.target_id } : {}),
      ...(f.detail ? { detail: f.detail } : {}),
      occurredAt: new Date(f.occurred_at),
    }));
  }
}
