// Comprobación rápida de un despliegue real (por defecto, producción). No crea datos:
// solo lee páginas y hace un login con credenciales que no existen.
// Uso: `npm run smoke:prod` o `node scripts/smoke-prod.mjs https://otra-url`.
// La ejecuta también GitHub Actions tras cada despliegue de producción (workflow "Smoke producción").
const base = (process.argv[2] ?? "https://my-life-mirror.vercel.app").replace(/\/$/, "");

const checks = [
  ["portada", async () => {
    const res = await fetch(`${base}/`);
    return res.status === 200 && (await res.text()).includes('id="root"') || `HTTP ${res.status}`;
  }],
  // Rutas de la app (React Router): al recargar o abrir un enlace, Vercel debe servir index.html.
  ...["/inicio", "/login", "/restablecer-password", "/perfil/entrevista", "/ayuda"].map((path) => [`ruta ${path}`, async () => {
    const res = await fetch(`${base}${path}`);
    return res.status === 200 && (await res.text()).includes('id="root"') || `HTTP ${res.status}`;
  }]),
  ["api: sesión", async () => {
    const res = await fetch(`${base}/api/accounts/session`);
    const region = res.headers.get("x-vercel-id") ?? "";
    if (res.status !== 200) return `HTTP ${res.status}`;
    // Las funciones deben correr en Dublín, junto a Supabase (vercel.json).
    return region.includes("dub1") || `región inesperada (${region})`;
  }],
  ["api: login (conecta con Supabase)", async () => {
    const res = await fetch(`${base}/api/accounts/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "smoke-no-existe@example.com", password: "no-es-una-clave" }),
    });
    // 401 = la función arrancó, leyó sus variables y Supabase respondió. 500 = algo de eso falla.
    return res.status === 401 || `HTTP ${res.status}`;
  }],
  ["api: ruta inexistente", async () => {
    const res = await fetch(`${base}/api/no-existe`);
    return res.status === 404 || `HTTP ${res.status} (debería ser 404, no la app)`;
  }],
];

let failures = 0;
console.log(`Smoke: ${base}`);
for (const [name, check] of checks) {
  let result;
  try {
    result = await check();
  } catch (error) {
    result = String(error);
  }
  if (result === true) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.log(`  ✘ ${name}: ${result}`);
  }
}
if (failures > 0) {
  console.log(`\n${failures} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log("\nTodo en orden.");
