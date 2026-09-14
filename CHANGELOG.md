# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/) — versión `0.x`: en desarrollo inicial, la API/estructura puede cambiar sin previo aviso hasta la `1.0.0`.

## [Sin publicar]

Sin cambios todavía.

## [0.1.0] - 2026-09-14

Primera entrega funcional del Ciclo 1 (MVP): Sprint 0 completo + Sprint 1 hasta la fecha (cuentas, navegación e i18n). Ver [01_Backlog_MVP.md](docs/project-management/01_Backlog_MVP.md) para el detalle por sprint.

### Añadido

- Estructura base del proyecto: Monolito Modular con Clean Architecture por módulo (`domain/`/`application`/`infrastructure`/`ui`), Composition Root (`container.ts`), Vitest + alias de módulo ([03_Arquitectura_Software.md](docs/architecture-decisions/03_Arquitectura_Software.md)).
- **RF-01** — registro e inicio de sesión sobre Supabase Auth, vía el puerto `AuthProvider` (`SupabaseAuthProvider` real, `InMemoryAuthProvider` para tests). Sesión en cookie `httpOnly` puesta por `api/login.ts` ([06_Autenticacion.md](docs/architecture-decisions/06_Autenticacion.md)).
- **RF-38** — recuperación de contraseña de extremo a extremo (`SolicitarRecuperacion`/`RestablecerPassword`), sin revelar nunca si un email existe.
- **RF-39** — routing real con React Router: Landing pública, Home protegida (`RutaProtegida` + `useSesion`), `api/sesion.ts` y `api/logout.ts`.
- **RF-30** — lógica de líneas de ayuda en crisis (`obtenerLineasAyudaCrisis`), lista para su colocación visual en una pantalla de ayuda futura.
- **RNF-10** — internacionalización ES/EN con `react-i18next`; todas las pantallas de cuentas traducidas, con selector manual de idioma en el `Header` ([09_Internacionalizacion.md](docs/architecture-decisions/09_Internacionalizacion.md)).
- `Breadcrumbs` y `Header` como componentes de navegación reutilizables en `shared/ui/` ([07_UI.md](docs/architecture-decisions/07_UI.md) §5).
- Material UI como librería de interfaz, con tema explícito en modo claro.
- Observabilidad mínima: logger estructurado en JSON para los endpoints de `api/` ([08_Observabilidad.md](docs/architecture-decisions/08_Observabilidad.md)).

### Cambiado

- Almacenamiento y autenticación: de MongoDB Atlas a Supabase (Postgres + Auth gestionada) — decisión tomada antes de construir ningún adaptador real contra Mongo ([04_Almacenamiento_Datos.md](docs/architecture-decisions/04_Almacenamiento_Datos.md) v2.0).

### Corregido

- UI oscura no intencionada por falta de `ThemeProvider`/`CssBaseline` y `color-scheme: light dark` en conflicto con el tema.
- Fallo real en producción: los alias `@shared/@modules` no se resuelven dentro de `api/*.ts` (Vercel bundlea aparte de Vite) — todo el código alcanzable desde `api/` pasa a imports relativos.
- Tests de React sin limpieza entre casos (`tests/setup.ts` añade `afterEach(cleanup)`).

---

## Historial de cambios (de este archivo)

- **v1.0 (14 sept. 2026)** — se crea `CHANGELOG.md`, con la primera entrada `[0.1.0]` cubriendo todo el trabajo de Sprint 0 (resto) y Sprint 1 hasta la fecha, previo a su primera PR.
