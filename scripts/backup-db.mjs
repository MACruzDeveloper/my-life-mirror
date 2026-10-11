// `npm run backup:db`: copia de seguridad de la base de datos en un archivo JSON local.
// El plan gratuito de Supabase no guarda copias: si la base se borra o se estropea, no hay
// vuelta atrás. Esto es la red mínima (plan de seguridad, paso 10). Solo LEE: no cambia nada.
//
//   npm run backup:db              la base REAL del .env (producción)
//   npm run backup:db -- --local   el Supabase local en Docker (para probar el script)
//
// Guarda todas las tablas de `public` (las descubre solas: una tabla nueva entra sin tocar
// esto) y la lista de cuentas (id, email, rol, fechas). Las contraseñas NO se pueden copiar:
// Supabase no las entrega. Tras restaurar, cada persona tendría que recuperar la suya.
//
// El archivo contiene datos personales de todos los usuarios: se queda en `backups/` (fuera
// de Git), legible solo por ti. Guárdalo en un sitio cifrado y borra los antiguos.
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ensureLocalSupabase } from "./local-supabase.mjs";

const PAGE_SIZE = 1000;
const local = process.argv.includes("--local");

if (local) {
  const { studioUrl: _studio, mailUrl: _mail, ...env } = ensureLocalSupabase({ appUrl: "http://localhost:5175" });
  Object.assign(process.env, env);
} else {
  try {
    process.loadEnvFile(".env");
  } catch {
    console.error("No se pudo leer .env (hace falta para la base real). Para la base local: npm run backup:db -- --local");
    process.exit(1);
  }
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const host = new URL(url).host;
const client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

/** Las tablas de `public`, tal como las publica la API de Supabase. */
async function listTables() {
  const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
  if (!response.ok) throw new Error(`No se pudo leer la lista de tablas (HTTP ${response.status})`);
  const { definitions = {} } = await response.json();
  return Object.keys(definitions).sort();
}

async function readTable(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select("*").range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`No se pudo leer ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function readUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw new Error(`No se pudo leer la lista de cuentas: ${error.message}`);
    users.push(...data.users.map((user) => ({ id: user.id, email: user.email, app_metadata: user.app_metadata, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at, banned_until: user.banned_until })));
    if (data.users.length < PAGE_SIZE) return users;
  }
}

console.log(`\nCopia de seguridad de ${host}${local ? " (local)" : " (REAL)"}. Solo lectura.\n`);

const tables = {};
for (const table of await listTables()) {
  tables[table] = await readTable(table);
  console.log(`  ${table.padEnd(24)} ${tables[table].length} filas`);
}
const users = await readUsers();
console.log(`  ${"(cuentas)".padEnd(24)} ${users.length}`);

const takenAt = new Date().toISOString();
const file = `backups/backup-${host.replace(/[^a-z0-9.-]/gi, "_")}-${takenAt.replace(/[:.]/g, "-")}.json`;
mkdirSync("backups", { recursive: true, mode: 0o700 });
writeFileSync(file, JSON.stringify({ takenAt, host, users, tables }, null, 2), { mode: 0o600 });

console.log(`\nGuardada en ${file}`);
console.log("Contiene datos personales: guárdala en un sitio cifrado y no la compartas.\n");
