// `npm run test:e2e:api`: tests E2E con api/ contra un Supabase local (Docker).
// 1. Arranca el Supabase local si hace falta.
// 2. Vacía la base local y reaplica supabase/migrations (cada ejecución empieza limpia).
// 3. Lanza Playwright con las variables del Supabase local, que tienen prioridad sobre
//    el .env: Vite no carga el .env en process.env.
// Argumentos extra se pasan a Playwright (p. ej. `npm run test:e2e:api -- --ui`).
import { spawnSync } from "node:child_process";
import { ensureLocalSupabase, resetLocalDatabase } from "./local-supabase.mjs";

const { studioUrl, mailUrl, ...env } = ensureLocalSupabase({ appUrl: "http://localhost:5174" });
await resetLocalDatabase();

const result = spawnSync("npx", ["playwright", "test", "-c", "playwright.api.config.ts", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, ...env },
});
process.exit(result.status ?? 1);
