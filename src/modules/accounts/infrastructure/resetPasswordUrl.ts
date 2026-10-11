/**
 * La dirección a la que Supabase devuelve a la persona tras pulsar el enlace
 * de recuperación (RF-38). Tiene que coincidir letra a letra con una de las
 * "Redirect URLs" de Supabase; si no, Supabase la descarta y manda a la
 * portada. Por eso se limpia `APP_URL`: una barra final o un espacio al
 * copiarla en Vercel bastan para que deje de coincidir (fallo real, 11 oct.).
 */
export function resetPasswordUrl(appUrl: string): string {
  return `${appUrl.trim().replace(/\/+$/, "")}/restablecer-password`;
}
