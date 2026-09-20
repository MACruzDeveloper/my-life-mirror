/**
 * Roles de usuario — RNF-13. "admin" es de uso interno del equipo (una sola
 * persona por ahora); "premium" es la base para RN-11/RD-10, sin ventajas
 * concretas definidas todavía. Nadie se autoasigna un rol distinto de
 * "usuario": premium/admin se conceden a mano (Supabase dashboard,
 * app_metadata) hasta que exista un flujo de gestión dedicado.
 */
export type RolUsuario = "usuario" | "premium" | "admin";

export const ROL_POR_DEFECTO: RolUsuario = "usuario";

export const ROLES_VALIDOS: readonly RolUsuario[] = ["usuario", "premium", "admin"];

/**
 * Traduce el `app_metadata` de Supabase a un RolUsuario válido, con
 * `ROL_POR_DEFECTO` como valor seguro ante cualquier dato ausente o
 * corrupto — nunca se asume un rol con más privilegios de los que constan
 * explícitamente (principio de mínimo privilegio).
 */
export function leerRolDesdeMetadata(appMetadata: unknown): RolUsuario {
  const valor = (appMetadata as { rol?: unknown } | null | undefined)?.rol;
  return typeof valor === "string" && (ROLES_VALIDOS as readonly string[]).includes(valor)
    ? (valor as RolUsuario)
    : ROL_POR_DEFECTO;
}
