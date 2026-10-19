import { defineConfig, devices } from "@playwright/test";

/**
 * Tests E2E de extremo a extremo *con* `api/` (registro, entrevista, consentimiento,
 * borrado de cuenta…), contra un Supabase local en Docker, nunca contra el real.
 * Se lanzan con `npm run test:e2e:api` (scripts/e2e-api.mjs), que arranca y
 * vacía la base local y pasa sus variables. Los de solo frontend siguen en
 * playwright.config.ts (`npm run test:e2e`, dentro del pre-push).
 */
export default defineConfig({
  testDir: "./e2e/api",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  // En GitHub Actions, 60 s: los recorridos largos (ideas con IA, compartir experiencias) rondan los 26 s
  // y, en un runner lento, pasaban de 30 sin que fallara nada (PR a main del 18 oct.).
  timeout: process.env.CI ? 60_000 : 30_000,
  use: {
    baseURL: "http://localhost:5174",
    trace: "retain-on-failure",
    // La captura del momento del fallo, junto a la traza (en CI, dentro del informe que se guarda).
    screenshot: "only-on-failure",
    // `E2E_VIDEO=1 npm run test:e2e:api`: graba un vídeo de cada test en test-results/
    // (material para la demo o la memoria). Desactivado por defecto: ralentiza.
    video: process.env.E2E_VIDEO ? "on" : "off",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npx vite --config vite.local.config.ts",
    url: "http://localhost:5174",
    // Caché de Vite propia: si no, re-empaquetar aquí rompe un `npm run dev:local` abierto (ver vite.config.ts).
    env: { VITE_CACHE_DIR: "node_modules/.vite-e2e-api" },
    // Nunca reutilizar un servidor ya abierto: podría no estar apuntando al Supabase local.
    reuseExistingServer: false,
  },
});
