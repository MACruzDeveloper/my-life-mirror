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
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:5174",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npx vite --config vite.local.config.ts",
    url: "http://localhost:5174",
    // Nunca reutilizar un servidor ya abierto: podría no estar apuntando al Supabase local.
    reuseExistingServer: false,
  },
});
