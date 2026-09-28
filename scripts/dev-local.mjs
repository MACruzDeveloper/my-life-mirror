// `npm run dev:local`: la app completa (frontend + api/) contra un Supabase local en
// Docker, sin cuentas de Vercel ni de Supabase. Pensado para probar la app desde cero
// (o enseñarla) sin tocar la base real. Los datos se conservan entre arranques; para
// empezar de cero: `npx supabase db reset`. Puerto 5175, distinto del de los tests
// (5174), para poder tener los dos abiertos a la vez.
import { spawnSync } from "node:child_process";
import { ensureLocalSupabase } from "./local-supabase.mjs";

const { studioUrl, mailUrl, ...env } = ensureLocalSupabase({ appUrl: "http://localhost:5175" });
console.log(`\nApp:                 http://localhost:5175`);
console.log(`Datos (Studio):      ${studioUrl}`);
console.log(`Correos (reset de contraseña): ${mailUrl}\n`);

const result = spawnSync("npx", ["vite", "--config", "vite.local.config.ts", "--port", "5175", "--open"], { stdio: "inherit", env: { ...process.env, ...env } });
process.exit(result.status ?? 1);
