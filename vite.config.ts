import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Caché de dependencias propia por servidor (VITE_CACHE_DIR): dos servidores de Vite a la vez
  // con la misma carpeta se pisan al re-empaquetar, y el navegador acaba con dos copias de React
  // ("Invalid hook call"). Pasó con los E2E y `npm run dev:local` abiertos a la vez (4 oct.).
  cacheDir: process.env.VITE_CACHE_DIR ?? "node_modules/.vite",
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
      // Cobertura por niveles (100/80/0, revisión de calidad del 18 oct.; 04_Plan_Verificacion_Validacion.md, apartado 1.3).
      thresholds: {
        // IMPORTANTE: toda la lógica de negocio.
        'src/**/{domain,application}/**': { statements: 90, branches: 80, functions: 95, lines: 95 },
        // CORE: lo que, si falla, expone datos, deja entrar a quien no debe o difunde un texto que no
        // debía salir (contraseñas, sesión, consentimiento, exportar y borrar datos, filtros de la IA y
        // de lo que se comparte, líneas de ayuda). Ninguna línea ni función sin ejecutar; las ramas que
        // quedan son valores por defecto defensivos (`?? []`), que no se fuerzan con tests artificiales.
        '{src/modules/accounts/domain/{Password,passwordPolicy,UserRole}.ts,src/modules/accounts/application/{ResumeSession,ResetPassword,RequestPasswordReset,DeleteAccount,EraseUser,ExportUserData,AdminUserActions}.ts,src/modules/consent/{domain,application}/*.ts,src/modules/recommendations/domain/{ideaSafety,offensiveTerms,shareableText,redactPersonalData}.ts,src/modules/wellbeing/{domain,application}/*.ts,src/shared/domain/AttemptLimiter.ts}':
          { functions: 100, lines: 100 },
      },
    },
  },
})
