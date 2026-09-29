import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    // Quality gate (`npm run test:coverage`, hook pre-push de Husky): el umbral
    // se exige solo a la lógica de negocio (dominio + aplicación), que se prueba
    // con Fakes. Los adaptadores de Supabase y las funciones de `api/` necesitan
    // la base de datos real: se miden, pero no bloquean. Umbrales fijados unos
    // puntos por debajo de lo medido el 27 sept. (95/87/99/98) para que no
    // fallen por ruido, pero sí si se añade lógica sin test.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text-summary', 'html'],
      thresholds: {
        'src/**/{domain,application}/**': { statements: 90, branches: 80, functions: 95, lines: 95 },
      },
    },
  },
})
