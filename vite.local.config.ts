import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vite.config.ts'
import { vercelApiRoutes } from './e2e/support/apiDevServer.ts'

// La app de siempre más las funciones de api/ servidas por Vite, contra el Supabase
// local en Docker: `npm run dev:local` y `npm run test:e2e:api` (ver e2e/support/apiDevServer.ts).
export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [vercelApiRoutes(fileURLToPath(new URL('./api', import.meta.url)))],
    server: { port: 5174, strictPort: true },
    // `npm run dev:local` (los E2E con api/ pasan la suya en VITE_CACHE_DIR): ver vite.config.ts.
    cacheDir: process.env.VITE_CACHE_DIR ?? 'node_modules/.vite-local',
  }),
)
