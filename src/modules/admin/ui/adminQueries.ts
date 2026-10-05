import { useQuery } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";

export interface AdminUserDto {
  id: string;
  email: string;
  name?: string;
  rol: "usuario" | "premium" | "admin";
  suspendido: boolean;
  createdAt: string;
  lastSignInAt?: string;
}

export interface AuditEntryDto {
  id: string;
  actorId: string;
  action: string;
  targetId?: string;
  detail?: string;
  occurredAt: string;
}

export const ADMIN_USERS_KEY = ["admin", "users"] as const;
export const ADMIN_AUDIT_KEY = ["admin", "audit"] as const;

export function useAdminUsers() {
  return useQuery({ queryKey: ADMIN_USERS_KEY, queryFn: ({ signal }) => getJson<AdminUserDto[]>("/api/admin/users", signal) });
}

export function useAdminAudit() {
  return useQuery({ queryKey: ADMIN_AUDIT_KEY, queryFn: ({ signal }) => getJson<AuditEntryDto[]>("/api/admin/audit", signal) });
}

/** POST de una acción de administración; devuelve el estado y el cuerpo para que la pantalla explique el error. */
export async function postAdmin<T = unknown>(action: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(`/api/admin/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, status: response.status, data: (await response.json()) as T };
}
