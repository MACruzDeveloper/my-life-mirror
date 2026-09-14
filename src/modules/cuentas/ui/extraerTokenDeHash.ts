/** Supabase entrega el token de recuperación en el hash de la URL (#access_token=...), no en query params. */
export function extraerTokenDeHash(hash: string): string | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("access_token") ?? undefined;
}
