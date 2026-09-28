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
  }),
)
