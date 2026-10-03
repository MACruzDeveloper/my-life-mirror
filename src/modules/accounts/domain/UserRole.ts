/**
 * Roles de usuario — RNF-13. "admin" es de uso interno del equipo (una sola
 * persona por ahora); "premium" es la base para RN-11/RD-10, sin ventajas
 * concretas definidas todavía. Nadie se autoasigna un rol distinto de
 * "usuario": premium/admin se conceden a mano (Supabase dashboard,
 * app_metadata) hasta que exista un flujo de gestión dedicado.
 */
export const USER_ROLES = ["usuario", "premium", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_ROLE: UserRole = "usuario";


/**
 * Traduce el `app_metadata` de Supabase a un RolUsuario válido, con
 * `ROL_POR_DEFECTO` como valor seguro ante cualquier dato ausente o
 * corrupto — nunca se asume un rol con más privilegios de los que constan
 * explícitamente (principio de mínimo privilegio).
 */
export function readRoleFromMetadata(appMetadata: unknown): UserRole {
  const value = (appMetadata as { rol?: unknown } | null | undefined)?.rol;
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value)
    ? (value as UserRole)
    : DEFAULT_ROLE;
}
