// `npm run demo:reset`: crea o restaura la cuenta de prueba de la entrega (TFM-01) y la
// cuenta "otra persona" que comparte experiencias con ella. Borra SOLO esas dos cuentas
// (por su email exacto) y las vuelve a crear con el contenido de
// src/shared/infrastructure/demo/demoAccount.json.
//
//   npm run demo:reset -- --local   contra el Supabase local en Docker (para probar o sacar capturas)
//   npm run demo:reset -- --yes     contra la base REAL del .env (producción); pide el --yes a propósito
//
// La contraseña sale de DEMO_USER_PASSWORD (en .env): así la que se entregó en privado sigue
// valiendo tras restaurar. Tiene rol de administración, así que debe cumplir la política de
// contraseñas. El email, de DEMO_USER_EMAIL (por defecto demo@example.com).
import { createServer, createServerModuleRunner } from "vite";
import { ensureLocalSupabase } from "./local-supabase.mjs";

// Solo para el Supabase local: no es la de producción.
const LOCAL_PASSWORD = "Faro-Verde-Marea-83";
const args = process.argv.slice(2);
const local = args.includes("--local");
const confirmed = args.includes("--yes");

if (local) {
  const { studioUrl: _studio, mailUrl: _mail, ...env } = ensureLocalSupabase({ appUrl: "http://localhost:5175" });
  Object.assign(process.env, env);
  process.env.DEMO_USER_PASSWORD ??= LOCAL_PASSWORD;
} else {
  try {
    process.loadEnvFile(".env");
  } catch {
    console.error("No se pudo leer .env (hace falta para la base real). Para la base local: npm run demo:reset -- --local");
    process.exit(1);
  }
}

const email = (process.env.DEMO_USER_EMAIL ?? "demo@example.com").trim();
const password = process.env.DEMO_USER_PASSWORD ?? "";
const host = (() => {
  try {
    return new URL(process.env.SUPABASE_URL ?? "").host;
  } catch {
    return "";
  }
})();

if (!host) {
  console.error("Falta SUPABASE_URL.");
  process.exit(1);
}
if (!password) {
  console.error("Falta DEMO_USER_PASSWORD en .env: es la contraseña (privada) de la cuenta de prueba, que tiene rol de administración y debe cumplir la política de contraseñas.");
  process.exit(1);
}

console.log(`\nCuenta de prueba: ${email}`);
console.log(`Base de datos:    ${host}${local ? " (local)" : " (REAL)"}`);
console.log("Se borrarán y volverán a crear esa cuenta y demo-otra-persona@example.com. Ninguna otra cuenta se toca.\n");

if (!local && !confirmed) {
  console.error("Es la base real: si es lo que quieres, repite el comando con `-- --yes`.");
  process.exit(1);
}

// El código de la app es TypeScript con imports `#shared/…`: se carga con Vite, como en los E2E.
// Sin preparar dependencias del navegador (`optimizeDeps`): aquí solo se ejecuta código del servidor.
const server = await createServer({
  configFile: false,
  appType: "custom",
  logLevel: "error",
  cacheDir: "node_modules/.vite-demo",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const runner = createServerModuleRunner(server.environments.ssr, { hmr: false });
  const { createAppContext } = await runner.import("/src/shared/infrastructure/container.ts");
  const { seedDemoAccount } = await runner.import("/src/shared/infrastructure/demo/seedDemoAccount.ts");
  const summary = await seedDemoAccount(createAppContext(), { email, password });
  await runner.close();
  console.log(`Hecho: ${summary.assessments} evaluaciones, ${summary.experiences} experiencias en el diario y ${summary.sharedExperiences} compartidas por "otra persona".`);
  console.log(`Entra con ${email} y la contraseña ${local && password === LOCAL_PASSWORD ? `"${LOCAL_PASSWORD}"` : "de DEMO_USER_PASSWORD"}.\n`);
} catch (error) {
  console.error(`\nNo se pudo completar: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await server.close();
}
