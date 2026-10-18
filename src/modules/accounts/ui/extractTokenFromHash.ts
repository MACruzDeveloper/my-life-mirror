/** Supabase entrega el token de recuperación en el hash de la URL (#access_token=...), no en query params. */
export function extractTokenFromHash(hash: string): string | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("access_token") ?? undefined;
}

/**
 * ¿Viene la persona de un enlace de recuperación? Supabase añade al hash el
 * token (`type=recovery`) o, si el enlace está gastado o caducado, un error.
 * Lo usa la portada: si Supabase no acepta la dirección de vuelta, manda ahí
 * a la persona, y sin esto se quedaría delante de "Crear cuenta" sin saber
 * qué ha pasado.
 */
export function isRecoveryHash(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return (params.has("access_token") && params.get("type") === "recovery") || (params.has("error") && params.has("error_code"));
}

