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
    const ids = execFileSync("docker", ["ps", "-aq", "--filter", "name=_my-sims"], { encoding: "utf8" }).split("\n").filter(Boolean);
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
export function resetLocalDatabase() {
  console.log("Vaciando la base local y reaplicando las migraciones…");
  supabase("db", "reset");
}
