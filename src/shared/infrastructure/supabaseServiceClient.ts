import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * El cliente de Supabase que usa el servidor, con la service role key (solo en
 * `api/`, nunca en el navegador). Un único sitio para su configuración (SEC-03):
 * sin sesión guardada ni renovación automática. El servidor actúa siempre con
 * su propia clave; no debe quedarse en memoria con la sesión de nadie entre
 * una petición y la siguiente (una función serverless "caliente" se reutiliza).
 */
export function createServiceClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
