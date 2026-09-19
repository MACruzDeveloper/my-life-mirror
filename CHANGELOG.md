# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/) — versión `0.x`: en desarrollo inicial, la API/estructura puede cambiar sin previo aviso hasta la `1.0.0`.

## [Sin publicar]

### Añadido

- **RF-04** — módulo `consentimiento` (dominio + aplicación): entidad `Consentimiento`, casos de uso `OtorgarConsentimiento`/`VerificarConsentimiento`. Idempotente por versión de política. Cierra el Sprint 1; disparador real y persistencia Supabase llegan con RF-06/RF-07 (ver más abajo).
- **RNF-13** — roles de usuario (`usuario`/`premium`/`admin`) en `UsuarioAutenticado`, guardados en `app_metadata` de Supabase (no autoasignable por el propio usuario). Base para el futuro rol de administrador y para RN-11 (premium).
- **RF-03** — perfil de usuario (nombre, fecha de nacimiento, género opcional, zona horaria): entidad `Profile`, casos de uso `UpdateProfile`/`GetProfile` (upsert parcial), adaptador en memoria, vista `ProfileForm` (mobile-first, con precarga, selector de fecha nativo) y endpoint `api/accounts/profile.ts`. `name` se captura ya en el registro (RF-01), no aquí.
- `ProtectedLayout` (`shared/ui/`): envoltorio común a las pantallas protegidas (`Header` + breadcrumbs opcionales), usado ahora por `Home` y la nueva pantalla de perfil.
- Enlace a `/perfil` en el `Header`, que ahora muestra `name` (con el email como reserva) vía `/api/accounts/session` — sin llamada aparte a `/api/accounts/profile`.
- Filosofía mobile-first adoptada para todo el frontend (RNF-06 ampliado).
- **RF-06/RF-07** — catálogo de 9 categorías estándar (módulo `categories`), sembrado por usuario en el primer `ListCategories`; `ActivateCategory`/`DeactivateCategory` sobre `CategoryRepository` (Supabase real desde el principio). Activar una categoría sensible sin consentimiento devuelve `ConsentRequiredError` (nuevo en la jerarquía `DomainError`) — el frontend muestra un modal que llama al primer endpoint real de RF-04 (`api/consent/grant.ts`) y reintenta. Vista `CategoriesPage`, endpoints `api/categories/index.ts`, `api/categories/activate.ts`, `api/categories/deactivate.ts`.
- `PrivacyPolicyPage` (`/politica-privacidad`, pública, RNF-05): antes del modal de consentimiento no había nada real que leer. Enlazada desde el modal; muestra la misma `VERSION_POLITICA_ACTUAL` que valida el backend. Contenido de borrador razonable para un TFM, no redactado por asesoría legal.

### Cambiado

- `useSesion` se mueve de `modules/cuentas/ui/` a `shared/ui/` para que `ProtectedLayout` pueda usarlo sin invertir la dirección de dependencia entre `shared` y los módulos.
- Código y nombres de archivo en inglés a partir de ahora (comentarios/docs siguen en español) — aplicado a todo lo tocado en RF-03: `RegistrarUsuario`→`RegisterUser`, `RegistroForm`→`RegisterForm`, `Perfil`→`Profile`, `ConfigurarPerfil`→`UpdateProfile`, `ObtenerPerfil`→`GetProfile`, `LayoutProtegido`→`ProtectedLayout`, `api/registro.ts`→`api/register.ts`, `api/configurar-perfil.ts`→`api/profile.ts` (y, más tarde el 15 sept., toda la carpeta `api/` se reorganiza en subcarpetas — ver más abajo). El resto del código existente (no tocado en este cambio) se renombra cuando se toque, no en un pase retroactivo — ver AGENTS.md.
- `edad` (entero) sustituida por `birthDate` (fecha, selector nativo `<input type="date">`).
- `api/` reorganizado en subcarpetas por capacidad de negocio (`accounts/`, `categories/`, `consent/`), reflejando la estructura de `src/modules/` — Vercel sí soporta rutas anidadas de forma nativa (carpeta → segmento de URL); la duda sobre esto venía de un incidente anterior ya resuelto por otra causa (`SUPABASE_URL` mal configurada, ADR-06 §2), no de un problema real con anidar carpetas. URLs afectadas: `/api/register`→`/api/accounts/register`, `/api/login`→`/api/accounts/login`, `/api/logout`→`/api/accounts/logout`, `/api/sesion`→`/api/accounts/session`, `/api/solicitar-recuperacion`→`/api/accounts/request-password-reset`, `/api/restablecer-password`→`/api/accounts/reset-password`, `/api/profile`→`/api/accounts/profile`, `/api/activate-category`→`/api/categories/activate`, `/api/deactivate-category`→`/api/categories/deactivate`, `/api/grant-consent`→`/api/consent/grant` (`/api/categories` sin cambios).
- Header consolidado: "Perfil" y "Categorías" eran dos enlaces sueltos, ahora es uno solo ("Mi perfil") hacia `AccountPage`, con Perfil y Categorías como pestañas (rutas anidadas `/perfil` y `/perfil/categorias`, no solo estado local — recargables/enlazables).
- Metodología: se abandonan los sprints semanales por Lean + Kanban con apetito fijo y línea de corte ([00_Metodologia_Lean.md](docs/project-management/00_Metodologia_Lean.md)); el backlog pasa a ser un tablero Kanban. `docs/user-stories/` se mantiene plano (una historia por archivo, sin carpetas por sprint).
- Playwright instalado (`e2e/`, `npm run test:e2e`, `tsconfig.e2e.json`) — primer test cubre solo páginas públicas (no toca `api/`). Automatizar RF-01 (registro/login) queda pendiente de decidir cómo aislar los datos de prueba en Supabase.

### Corregido

- `RegisterUser` no aislaba el guardado del perfil inicial (`updateProfile`) del alta en Supabase Auth: una excepción ahí habría reportado el registro entero como fallido pese a que la cuenta ya existiera. Ahora va en su propio try/catch, sin poder deshacer un registro ya válido.
- Bug real encontrado en pruebas manuales: tras guardar el perfil, el `Header` seguía mostrando el email en vez del nombre recién guardado. `useSesion` (hook independiente, sin forma de invalidarse) se sustituye por `SessionProvider`/`useSession` (contexto de React) — `RutaProtegida` (renombrada `ProtectedRoute`) instala un único contexto por ruta que `ProtectedLayout` y `ProfileForm` comparten, así `ProfileForm` puede pedir un `refresh()` tras guardar.
- Bug real más profundo, mismo síntoma: `ProfileRepository`/`ConsentimientoRepository` en memoria no sobreviven entre funciones serverless distintas de `api/` (cada archivo es una función aislada, sin memoria compartida — ni en producción ni en `vercel dev`). Se adelanta su persistencia real a Supabase (`SupabaseProfileRepository`, `SupabaseConsentimientoRepository`) desde ahora, no en el Sprint 5 como estaba planeado — ver [04_Almacenamiento_Datos.md](docs/architecture-decisions/04_Almacenamiento_Datos.md) §7bis. Esquemas en `supabase/migrations/`.
- `api/accounts/session.ts` devolvía 500 (rompiendo la comprobación de sesión entera) si `getProfile` fallaba por cualquier motivo — p. ej. la tabla `profiles` sin migrar todavía. Aislado en su propio try/catch: un fallo ahí ahora solo significa "sin nombre todavía", nunca "no sé si hay sesión" (mismo criterio que `RegisterUser`).

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
