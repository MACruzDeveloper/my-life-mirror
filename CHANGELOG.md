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
- **RF-10** — entrevista personal (los requisitos la llaman check-in): módulo `assessments` (`Score` 1-10, `Assessment` inmutable, `RecordAssessments` todo o nada con nota opcional), persistencia Supabase desde el principio (`supabase/migrations/0004_assessments.sql`), endpoint `api/assessments` (POST guarda, GET devuelve la última puntuación por categoría vía `GetLatestScores`), pantalla `/perfil/entrevista` (conversación con avatares por defecto, elegir categorías + "Seleccionar todas", puntuación parcial, botones 1-10 sin valor por defecto oculto) y `/perfil/resultados` (tarjetas con color por banda: rojo/naranja/amarillo/verde, suaves y siempre con número y texto). Sin periodos (RF-09) ni recomendaciones (RF-18) todavía.
- Plan de métricas DORA y Flow para la revisión de calidad ([02_Metricas_DORA_y_Flujo.md](docs/project-management/02_Metricas_DORA_y_Flujo.md)); solo planificación.
- `PrivacyPolicyPage` (`/politica-privacidad`, pública, RNF-05): antes del modal de consentimiento no había nada real que leer. Enlazada desde el modal; muestra la misma `VERSION_POLITICA_ACTUAL` que valida el backend. Contenido de borrador razonable para un TFM, no redactado por asesoría legal.

### Añadido (panel de administración)

- `npm run check:api` (`scripts/check-api-types.mjs`): compila `api/` como lo hace Vercel (config leída sin `extends`, `nodenext` por defecto), para detectar antes de subir el fallo de despliegue de `api/tsconfig.json`.
- **ADM-02** — catálogo global de categorías gestionable por el admin: tabla `category_catalog` (`supabase/migrations/0005_category_catalog.sql`, con las 9 estándar), casos de uso `ListCatalog`/`AddCatalogCategory`/`RetireCatalogCategory`, endpoints `api/admin/categories` y `api/admin/categories/retire`, pestaña "Categorías" en `/admin`. Añadir: la categoría llega inactiva a todos los usuarios al listar (`ListCategories` ahora sincroniza con el catálogo). Retirar: se marca `retired_at` (no se borra), se desactiva en todos los usuarios, `ActivateCategory` la rechaza y las puntuaciones guardadas se conservan. `requireAdmin` compartido (`shared/domain/Actor.ts`); `ForbiddenError` → 403.

- **ADM-01 (propuesto)** — primer corte: `/admin` y `GET /api/admin/users` (lista de usuarios: email, rol, alta, último acceso) solo para `admin`. El rol se lee de la sesión verificada en el servidor; `ListUsers` lo vuelve a comprobar (`ForbiddenError` → 403) y la interfaz (enlace en el `Header`, `AdminRoute`) es solo comodidad. Sin datos de contenido de los usuarios. `SessionContext` expone `rol`.

### Cambiado

- Registro (RF-01): tras crear la cuenta el servidor deja la sesión iniciada (`cookieDeSesion` compartida con el login) y el usuario va directo a `/inicio`; si el inicio de sesión fallara, se muestra el mensaje anterior con enlace a `/login`.
- Entrevista (RF-10): categorías en dos columnas (las sensibles aparte, con explicación del consentimiento; "Seleccionar todas" solo afecta a la otra) y aside con el historial de cambios (`GetAssessmentHistory`, `GET /api/assessments/history`: cada guardado con "antes → ahora").

- Entrevista editable: ya no hay que "hacer una entrevista nueva". Muestra las categorías activas con su última puntuación precargada; cambiar una puntuación inserta un registro nuevo (RF-12: nada se sobrescribe); marcar/desmarcar categorías las activa/desactiva (esto cubre la interfaz de desactivación que se había quitado).

- Entrevista (RF-10): las categorías se eligen y activan dentro de la propia entrevista (se elimina `CategoriesPage` y la ruta `/perfil/categorias`; el modal de consentimiento se traslada); icono de ejemplos por pregunta (desplegable en línea, textos ES/EN); los números dejan de colorearse y la respuesta recibe un degradado de fondo suave animado por banda (`BandBackground`, respeta `prefers-reduced-motion`). **Pendiente:** interfaz para desactivar categorías.
- `Home` (`/inicio`): primera vez (sin puntuaciones) → bienvenida con enlace grande a la entrevista; usuario recurrente → panel con tarjetas de resultados (adelanto de RF-14).

- `useSesion` se mueve de `modules/cuentas/ui/` a `shared/ui/` para que `ProtectedLayout` pueda usarlo sin invertir la dirección de dependencia entre `shared` y los módulos.
- Código y nombres de archivo en inglés a partir de ahora (comentarios/docs siguen en español) — aplicado a todo lo tocado en RF-03: `RegistrarUsuario`→`RegisterUser`, `RegistroForm`→`RegisterForm`, `Perfil`→`Profile`, `ConfigurarPerfil`→`UpdateProfile`, `ObtenerPerfil`→`GetProfile`, `LayoutProtegido`→`ProtectedLayout`, `api/registro.ts`→`api/register.ts`, `api/configurar-perfil.ts`→`api/profile.ts` (y, más tarde el 15 sept., toda la carpeta `api/` se reorganiza en subcarpetas — ver más abajo). El resto del código existente (no tocado en este cambio) se renombra cuando se toque, no en un pase retroactivo — ver AGENTS.md.
- `edad` (entero) sustituida por `birthDate` (fecha, selector nativo `<input type="date">`).
- `api/` reorganizado en subcarpetas por capacidad de negocio (`accounts/`, `categories/`, `consent/`), reflejando la estructura de `src/modules/` — Vercel sí soporta rutas anidadas de forma nativa (carpeta → segmento de URL); la duda sobre esto venía de un incidente anterior ya resuelto por otra causa (`SUPABASE_URL` mal configurada, ADR-06 §2), no de un problema real con anidar carpetas. URLs afectadas: `/api/register`→`/api/accounts/register`, `/api/login`→`/api/accounts/login`, `/api/logout`→`/api/accounts/logout`, `/api/sesion`→`/api/accounts/session`, `/api/solicitar-recuperacion`→`/api/accounts/request-password-reset`, `/api/restablecer-password`→`/api/accounts/reset-password`, `/api/profile`→`/api/accounts/profile`, `/api/activate-category`→`/api/categories/activate`, `/api/deactivate-category`→`/api/categories/deactivate`, `/api/grant-consent`→`/api/consent/grant` (`/api/categories` sin cambios).
- Header consolidado: "Perfil" y "Categorías" eran dos enlaces sueltos, ahora es uno solo ("Mi perfil") hacia `AccountPage`, con un menú lateral (cajón fijo en md+, desplegable en móvil) que sustituye a las pestañas: Perfil, Categorías, Entrevista y Resultados (rutas anidadas `/perfil/*`, recargables/enlazables).
- Metodología: se abandonan los sprints semanales por Lean + Kanban con apetito fijo y línea de corte ([00_Metodologia_Lean.md](docs/project-management/00_Metodologia_Lean.md)); el backlog pasa a ser un tablero Kanban. `docs/user-stories/` se mantiene plano (una historia por archivo, sin carpetas por sprint).
- Playwright instalado (`e2e/`, `npm run test:e2e`, `tsconfig.e2e.json`) — primer test cubre solo páginas públicas (no toca `api/`). Automatizar RF-01 (registro/login) queda pendiente de decidir cómo aislar los datos de prueba en Supabase.

### Corregido

- Despliegue en Vercel rechazado por el plan Hobby ("No more than 12 Serverless Functions"): había 16 archivos en `api/`. Los handlers de `accounts/*` y `categories/activate|deactivate` pasan a `src/shared/infrastructure/http/handlers/` y se despachan desde `api/accounts/[action].ts` y `api/categories/[action].ts` con un pequeño `createRouter` (con test); las URLs no cambian. Quedan 9 funciones. `npm run check:api` avisa si se superan 12.

- Despliegue en Vercel fallaba al compilar las funciones de `api/` (TS2591 y TS2835 en `api/categories/index.ts`): Vercel busca el `tsconfig.json` subiendo desde la función y solo encontraba el de la raíz, que no tiene opciones (solo referencias), así que aplicaba su valor por defecto `nodenext` — que exige extensiones en los imports relativos y no localiza los tipos de Node. Se añade `api/tsconfig.json` **autocontenido** (resolución `bundler`, `types: ["node"]`). Un primer intento con `"extends": "../tsconfig.api.json"` no funcionó: Vercel lee el archivo sin resolver `extends`, así que veía un `compilerOptions` vacío y seguía cayendo en `nodenext` (45 errores en todas las funciones). Reproducido en local imitando ese comportamiento y comprobado con la versión autocontenida (0 errores).

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
