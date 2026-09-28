import { defineConfig, devices } from "@playwright/test";

/**
 * V&V (04_Plan_Verificacion_Validacion.md §1) + lección de §1.1: Vitest no
 * puede detectar que un dato no sobrevive entre funciones serverless
 * distintas — solo un navegador real contra la app real lo hace. `webServer`
 * arranca `vite` (frontend puro) automáticamente antes de los tests; el
 * primer test (e2e/landing.spec.ts) solo necesita eso. Pruebas que toquen
 * de verdad `api/` (registro, login...) necesitan `vercel dev` en su lugar —
 * deliberadamente no configurado todavía, ver docs/user-stories o pregunta
 * al usuario antes de que un test cree cuentas reales en Supabase.
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
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `npx vite` a secas, no `npm run dev` — ese script tiene `--open`, que
    // intentaría abrir una ventana de navegador real innecesaria aquí.
    // Puerto 5173 (por defecto de Vite) — distinto del 3000 que usa
    // `vercel dev` (npm run dev:full); este primer test no necesita `api/`.
    command: "npx vite",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
