import { defineConfig, devices } from "@playwright/test";

/**
 * V&V (04_Plan_Verificacion_Validacion.md apartado 1) + lección de apartado 1.1: Vitest no
 * puede detectar que un dato no sobrevive entre funciones serverless
 * distintas — solo un navegador real contra la app real lo hace. `webServer`
 * arranca `vite` (frontend puro) automáticamente antes de los tests. Las
 * pruebas que tocan `api/` van aparte, contra un Supabase local en Docker
 * (playwright.api.config.ts, `npm run test:e2e:api`), nunca contra la base real.
 */
export default defineConfig({
  testDir: "./e2e",
  // e2e/api necesita el Supabase local: va aparte (playwright.api.config.ts, `npm run test:e2e:api`).
  testIgnore: ["api/**"],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    // Visibilidad (revisión de calidad del 18 oct.): la captura del momento del fallo, en test-results/.
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `npx vite` a secas, no `npm run dev` — ese script tiene `--open`, que
    // intentaría abrir una ventana de navegador real innecesaria aquí.
    // Puerto 5173 (por defecto de Vite) — distinto del 3000 que usa
    // `vercel dev` (npm run dev:full); este primer test no necesita `api/`.
    command: "npx vite",
    url: "http://localhost:5173",
    // Caché de Vite propia, para no pisar la de `npm run dev` si está abierto (ver vite.config.ts).
    env: { VITE_CACHE_DIR: "node_modules/.vite-e2e" },
    reuseExistingServer: !process.env.CI,
  },
});
