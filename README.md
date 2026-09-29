# MyLifeMirror

Aplicación web para evaluar cómo va tu vida por áreas (economía, familia, deporte…), ver tu equilibrio y su evolución, y recibir ideas concretas para mejorar lo que tú elijas, **sin juicios ni comparaciones**. Trabajo de Fin de Máster del Máster en Desarrollo con IA (BIG School).

- **Stack:** React 19 + TypeScript + Vite, Material UI, TanStack Query, react-i18next (español e inglés), Apache ECharts; funciones serverless en Vercel (`api/`); Supabase (Postgres + Auth).
- **En producción:** https://my-life-mirror.vercel.app
- **Arquitectura:** monolito modular con Clean Architecture en cada módulo (dominio / aplicación / infraestructura), TDD y especificación Spec Anchored. Ver [docs/](docs/).

---

## Probarla en tu ordenador (sin cuentas)

La forma más sencilla: la app completa contra una base de datos **local** en Docker. No necesitas cuenta de Vercel ni de Supabase, y no toca ningún dato real.

**Requisitos:** [Node.js 22](https://nodejs.org/) y [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

```bash
npm install
npm run dev:local
```

La primera vez descarga las imágenes de Supabase (unos minutos). Después se abre la app en **http://localhost:5175**. El script muestra también:

| Dirección | Para qué |
|---|---|
| http://localhost:5175 | La app. Crea una cuenta y empieza por la entrevista. |
| http://127.0.0.1:54323 | Supabase Studio local: ver las tablas y los usuarios que vas creando. |
| http://127.0.0.1:54324 | Buzón local: aquí llegan los correos de "¿Olvidaste tu contraseña?". |

Los datos se conservan entre arranques. Para empezar de cero: `npx supabase db reset`. Para apagar la base local y liberar memoria: `npx supabase stop`.

### Probar como administrador

El rol de administrador no se puede pedir desde la app, a propósito (RNF-13). En local, regístrate y ejecuta en Studio (*SQL Editor*), con tu email:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"rol": "admin"}'
where email = 'tu-email@ejemplo.com';
```

Cierra sesión y vuelve a entrar: aparecerá **Administración** en la cabecera (usuarios, catálogo de categorías y auditoría).

### Ver los gráficos con meses de historial

Una cuenta nueva solo tiene las respuestas de hoy. Para ver la evolución (y el radar) como si llevaras un año usando la app: activa algunas categorías, contesta la entrevista una vez y ejecuta [scripts/sql/simulated-history.sql](scripts/sql/simulated-history.sql) en el *SQL Editor* de Studio, con tu email. Añade una entrevista simulada al mes durante los 12 meses anteriores, sin tocar tus respuestas reales; el final del archivo trae la consulta para borrarlas.

### Idioma

Español por defecto; el botón **EN** / **ES** de arriba a la derecha cambia a inglés (también antes de tener cuenta).

---

## Tests

| Comando | Qué comprueba |
|---|---|
| `npm run test` | Tests unitarios y de componentes (Vitest). |
| `npm run test:coverage` | Lo mismo con cobertura; falla si la lógica de negocio baja del umbral. |
| `npm run test:e2e` | Playwright sobre las páginas públicas (sin base de datos). |
| `npm run test:e2e:api` | Playwright de extremo a extremo con `api/` contra el Supabase local (Docker): registro, entrevista, consentimiento, panel, exportar y eliminar la cuenta, en móvil y escritorio. Vacía la base local en cada ejecución. |
| `npm run verify` | El *quality gate* completo que se ejecuta antes de cada `git push` (Husky): lint, tests con cobertura, build, comprobación de `api/` y e2e. |

Para **ver** los tests E2E funcionando:

```bash
npm run test:e2e:api -- --ui       # ventana interactiva: elegir un test, verlo y recorrer cada paso
npm run test:e2e:api -- --headed   # los navegadores se abren y la app se usa sola
npm run test:e2e:api -- --reporter=html && npx playwright show-report   # informe en el navegador
```

En GitHub, cada PR ejecuta `test:e2e:api` automáticamente (workflow **E2E con api**). Más detalle en el [plan de verificación](docs/requirements-analysis/04_Plan_Verificacion_Validacion.md) (apartado 1.2).

---

## Desarrollo con el proyecto real (Vercel + Supabase)

Solo para quien tenga acceso a los proyectos de Vercel y Supabase del autor.

1. Copia `.env.example` a `.env` y rellena los valores (nunca se sube al repositorio).
2. `npx vercel link` una vez, con tu cuenta de Vercel.
3. `npm run dev:full` — frontend y `api/` juntos (`vercel dev`) contra la base **real**.

`npm run dev` arranca solo el frontend (sin `api/`). Las migraciones de `supabase/migrations/` se aplican a mano en el SQL Editor del proyecto real, en orden.

---

## Documentación

- [docs/README.md](docs/README.md) — **mapa de toda la documentación** y por dónde empezar.
- [AGENTS.md](AGENTS.md) — convenciones del proyecto y comandos (punto de entrada).
- [Requisitos](docs/requirements-analysis/) · [Decisiones de arquitectura (ADR)](docs/architecture-decisions/) · [Historias de usuario](docs/user-stories/) · [Tablero](docs/project-management/01_Backlog_MVP.md) · [Validación](docs/validation/)
- [CHANGELOG.md](CHANGELOG.md) — cambios por versión.
