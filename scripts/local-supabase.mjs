// Supabase local (Docker) compartido por `npm run dev:local` y `npm run test:e2e:api`.
// Nunca toca el proyecto real: `supabase start` levanta una copia en Docker y aplica
// supabase/migrations. Versión fijada para que todos usen la misma CLI.
import { execFileSync } from "node:child_process";

const supabase = (...args) => execFileSync("npx", ["-y", "supabase@2.118.0", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

function readStatus() {
  try {
    return Object.fromEntries(
      supabase("status", "-o", "env")
        .split("\n")
        .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
        .filter(Boolean)
        .map(([, key, value]) => [key, value]),
    );
  } catch {
    return undefined;
  }
}

/**
 * Los contenedores del Supabase local se marcan "reiniciar salvo que se paren":
 * así arrancan solos al abrir Docker Desktop, sin docker-compose. `npx supabase stop`
 * los apaga (y los borra), y la próxima vez que se arranquen se vuelven a marcar.
 * Si falla (p. ej. sin permisos), no es grave: solo habrá que arrancarlo a mano.
 */
function keepRunningWithDocker() {
  try {
    const ids = execFileSync("docker", ["ps", "-aq", "--filter", "name=_my-life-mirror"], { encoding: "utf8" }).split("\n").filter(Boolean);
    if (ids.length > 0) execFileSync("docker", ["update", "--restart", "unless-stopped", ...ids], { stdio: "ignore" });
  } catch {
    // Sin consecuencias para la app ni los tests.
  }
}

/** Arranca el Supabase local si hace falta y devuelve las variables que necesita la app. */
export function ensureLocalSupabase({ appUrl }) {
  let status = readStatus();
  if (!status?.API_URL) {
    console.log("Supabase local no está arrancado: arrancando (necesita Docker Desktop abierto; la primera vez descarga las imágenes)…");
    supabase("start");
    status = readStatus();
  }
  keepRunningWithDocker();
  return {
    SUPABASE_URL: status.API_URL,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    APP_URL: appUrl,
    APP_ENV: "dev",
    // RF-40a: en local y en los E2E, ideas personalizadas con el escritor *Fake*.
    AI_IDEAS_PROVIDER: "fake",
    studioUrl: status.STUDIO_URL,
    mailUrl: status.MAILPIT_URL ?? status.INBUCKET_URL,
  };
}

/** Vacía la base local y reaplica las migraciones. */
export async function resetLocalDatabase() {
  console.log("Vaciando la base local y reaplicando las migraciones…");
  supabase("db", "reset");
  await waitForSchema();
}

/**
 * Tras `db reset`, la API de Supabase (PostgREST) tarda un instante en volver a leer qué
 * tablas existen: si los tests empiezan antes, las primeras peticiones fallan con
 * "Could not find the table … in the schema cache" (1 de cada 4-5 ejecuciones, 3 oct.).
 * Se espera a que responda por las tablas que usa la app, incluida la de la última migración.
 */
async function waitForSchema({ tables = ["profiles", "categories", "assessments", "recommendations", "personalized_ideas", "experiences"], timeoutMs = 30_000 } = {}) {
  const status = readStatus();
  const headers = { apikey: status.SERVICE_ROLE_KEY, Authorization: `Bearer ${status.SERVICE_ROLE_KEY}` };
  const deadline = Date.now() + timeoutMs;
  for (const table of tables) {
    for (;;) {
      const response = await fetch(`${status.API_URL}/rest/v1/${table}?select=*&limit=1`, { headers }).catch(() => undefined);
      if (response?.ok) break;
      if (Date.now() > deadline) throw new Error(`La API local no ve la tabla "${table}" tras ${timeoutMs / 1000} s`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

