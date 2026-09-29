# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/). Hasta la `1.0.0` (primera entrega a producción, 29 sept. 2026) fue `0.x`, en desarrollo inicial. Desde entonces: MINOR = funcionalidad nueva, PATCH = corrección, MAJOR = un cambio que obligue a migrar datos o rompa lo existente.

## [Sin publicar]

## [1.0.0] - 2026-09-29

Primera entrega a producción (`main`): cierre del Ciclo 1 (MVP). Reúne todo lo fusionado en `develop` desde la 0.1.0.

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

### Añadido (RNF-10)

- Selector de idioma en las páginas públicas (portada, registro, login, recuperar contraseña, política): `LanguageSwitcher` compartido con la cabecera y nuevo `PublicLayout`. El botón se nombra en el idioma de destino ("English"/"Español"). Test E2E: se cambia a inglés en la portada y la elección se recuerda tras recargar.

### Añadido (ADM-02, multidioma)

- El admin crea las categorías con nombre y descripción en **cada idioma soportado** (hoy español e inglés, todos obligatorios; ningún nombre se repite en ningún idioma). Los textos viven en la nueva tabla `category_translations` (una fila por categoría e idioma) y la interfaz los resuelve **por id de catálogo** (`GET /api/categories/translations`, `useCategoryLabel`), en entrevista, historial, Resultados, evolución, radar y recomendaciones. Mismo modelo para las 9 estándar y las del admin. Lista de idiomas en un único sitio (`shared/domain/locales.ts`); el formulario y la tabla del admin se generan a partir de ella. `AdminCategories` reescrito con identificadores en inglés.
- `supabase/migrations/0009_category_translations_table.sql`: tabla `category_translations`, `category_catalog.key` (clave estable de las estándar, usada por ejemplos y recomendaciones en lugar del nombre) y `categories.catalog_id` (FK, en lugar de emparejar por nombre). Migra los datos de la 0008 y borra sus columnas; repetible.

### Cambiado (ADM-02)

- Sustituido el primer planteamiento bilingüe (columnas `name_en`/`description_en` de la migración 0008 y campos `nameEn`/`categoryNameEn` en los DTO): no escalaba a más idiomas. Eliminadas también las claves i18n `categoriasEstandar.*`.

### Corregido (RNF-10)

- El despliegue de la PR fallaba en `npm run build`: el caso de uso ya exigía los campos en inglés pero `api/admin/categories` no los aceptaba (trabajo que había quedado a medias). Corregido y comprobado con `npm run build` y `npm run check:api`.

- Los nombres y descripciones de las categorías estándar salían en español con la interfaz en inglés (vienen de la base de datos). Ahora se traducen al mostrarlos en entrevista, historial, Resultados, tarjetas de evolución, radar y recomendaciones (primero con claves `categoriasEstandar.*`; después con el modelo por id descrito en ADM-02, multidioma). La lista de ejemplos de la entrevista usa la `key` de la categoría (se elimina el `EXAMPLES_KEY` duplicado).

- `<html lang>` fijo en `en` con la app en español: ahora sigue al idioma elegido (lectores de pantalla).

### Añadido (gestión)

- Guion de la demo de cierre ([04_Guion_Demo_Cierre.md](docs/validation/04_Guion_Demo_Cierre.md)): preparación de la primera entrega a producción, demo de 25 minutos, preguntas probables. `E2E_VIDEO=1 npm run test:e2e:api` graba un vídeo de cada test (plan B de la demo).
- `scripts/sql/simulated-history.sql`: historial simulado de 12 meses para un usuario (una entrevista al mes, solo en sus categorías activas, antes de su primera respuesta real y enlazando con su puntuación actual), para ver la evolución y el radar en desarrollo y en la demo. Repetible y reversible (marca en los microsegundos de `recorded_at`). Probado sobre las 9 migraciones con PGlite.
- Primera revisión de métricas DORA y Flow ([02_Metricas_DORA_y_Flujo.md](docs/project-management/02_Metricas_DORA_y_Flujo.md) apartado 7) y dos reglas de flujo nuevas en el tablero.

### Añadido (verificación y documentación)

- Workflow de GitHub Actions **E2E con api** (`.github/workflows/e2e-api.yml`): en cada PR levanta un Supabase local y ejecuta `npm run test:e2e:api`; guarda el informe HTML como artefacto. Sin secretos: nunca toca la base real.
- `npm run dev:local`: la app completa contra el Supabase local (http://localhost:5175), sin cuentas ni `.env`. Lógica común con `test:e2e:api` en `scripts/local-supabase.mjs`; `vite.e2e.config.ts` pasa a `vite.local.config.ts`.
- `README.md` reescrito (era la plantilla de Vite): qué es la app, cómo probarla en local, cómo entrar como administrador, tests y cómo verlos funcionar.
- Plan de verificación, apartado 1.2.1 "Cómo ver que funciona".

### Cambiado (documentación)

- Referencias a apartados escritas con la palabra ("ADR-03, apartado 6.1") en lugar del símbolo de sección, en todo el repositorio.
- Numeración de apartados: "1bis/1ter/2bis/6bis/7bis/7ter" pasan a subapartados decimales (1.1, 1.2, 2.1, 6.1, 5.1, 6.1) en ADR-03, ADR-04, ADR-06, ADR-09 y el plan de verificación, con las referencias actualizadas en 29 archivos.

### Añadido (verificación)

- `npm run test:e2e:api`: tests E2E con `api/` contra un Supabase local en Docker (`supabase/config.toml`; la base se vacía y se reaplican las migraciones en cada ejecución). Servidor propio en Vite (`e2e/support/apiDevServer.ts`, rutas como Vercel, probado con Vitest) que se niega a arrancar si la base no es local y aísla la memoria de cada petición. Page Objects en `e2e/api/pages/`; 9 tests en móvil y escritorio (registro, login, cerrar sesión, consentimiento, entrevista, panel, idea, exportar y eliminar la cuenta).

### Corregido (despliegue)

- E2E con `api/` en GitHub Actions: el test de contraseña incorrecta fallaba en móvil (solo en CI, más lento). El Page Object elegía el menú móvil o el botón de escritorio con `isVisible()`, que no espera; ahora decide por el ancho de pantalla. Comprobado con 90 repeticiones en paralelo.

- Login, registro y el resto de la API devolvían 500 en la *preview* de Vercel: `Cannot find module …/http/router`. Las funciones corren como ESM nativo de Node, que no resuelve imports relativos sin extensión, y ni los tipos (`bundler`) ni `vercel dev` lo detectaban. Imports con `.js` en todo lo alcanzable desde `api/`, `api/tsconfig.json` en `nodenext`, y `npm run check:api` (también en el pre-push) comprueba ahora los archivos de `src/` que `api/` alcanza y carga cada función en Node.

### Cambiado (rendimiento y móvil)

- Iconos de `@mui/icons-material` (importados por ruta) en lugar de cinco SVG copiados a mano; sin cambio de tamaño en el paquete.

- Funciones de Vercel en Dublín (`vercel.json`, `"regions": ["dub1"]`), junto a la base de datos de Supabase (Irlanda); antes corrían en Washington y cada consulta cruzaba el Atlántico.
- **UX-03** — cabecera en móvil con menú (Inicio, Administración si es admin, Mi perfil, nombre, Cerrar sesión) en lugar de cinco botones; desde `sm`, sin cambios.
- Páginas públicas de cuenta con margen lateral en móvil y alineadas con las migas (`PublicFormBox`, sustituye 8 copias del mismo estilo).

### Añadido (calidad)

- Quality gates con Husky: `pre-commit` ejecuta lint y `typecheck`; `pre-push` ejecuta `npm run verify` (lint, tests con cobertura, build, `check:api` y e2e). Cobertura con `@vitest/coverage-v8` y umbral solo sobre la lógica de negocio (dominio + aplicación: 90/80/95/95; medido 95/87/99/98). Nuevos scripts `typecheck`, `test:coverage`, `verify`.

### Añadido (UX-02, destacar las propuestas)

- Cada tarjeta del panel escribe la banda de su puntuación ("Bajo", "Casi bajo", "Medio", "Bueno") junto al número, con los mismos textos que Resultados (`BAND_LABEL_KEYS` en `scoreBand.ts`, compartido).
- Resumen "Ideas para ti" arriba del panel (`IdeasSummary`) con un botón por recomendación abierta ("Idea para Economía"), que abre la misma ventana con el aviso de RES-05. `RecommendationButton` acepta una etiqueta opcional.

### Añadido (UX-01, guía de primer uso)

- "Cómo funciona" en tres pasos numerados (`HowItWorks`, `shared/ui/components/`) en la portada y en la bienvenida de Inicio de primera vez.
- La primera entrevista explica los pasos de la pantalla en la burbuja del entrevistador, con el nombre real del botón de guardar; al actualizar respuestas no se repiten.
- "Cómo leer esta página" en el panel (`DashboardGuide`): explica equilibrio, evolución, "Una idea para ti" y "Actualizar mis respuestas"; se cierra con "Entendido", se recuerda en `localStorage` (a salvo si el navegador lo bloquea) y se puede reabrir.

### Añadido (validación)

- Guion del test de usabilidad del MVP ([docs/validation/01_Guion_Test_Usabilidad.md](docs/validation/01_Guion_Test_Usabilidad.md)): preparación, cómo dirigir la sesión (pensar en voz alta, sesgo de cercanía), 8 tareas del flujo completo con lo que observar en cada una, SUS, preguntas sobre el tono (RN-04/RES-07) y regla de decisión por gravedad. Hoja de resultados lista para rellenar ([02_Resultados_Test_Usabilidad.md](docs/validation/02_Resultados_Test_Usabilidad.md)). Versión corta en inglés para la sesión real (~20 min, 5 tareas, 5 preguntas): [03_Short_Test_Script_EN.md](docs/validation/03_Short_Test_Script_EN.md).
- Resultados de la sesión de validación (27 sept.): RN-04 se cumple según lo declarado; un problema de gravedad 3 (guía de primer uso, corregido con UX-01); T5 no se intentó por decisión de la participante; tres ideas para el Ciclo 2.

### Añadido (RF-15)

- **RF-15** — radar de equilibrio ([historia](docs/user-stories/RF-15-radar-equilibrio.md)): tarjeta "Tu equilibrio" en Inicio, encima de la evolución, con la última puntuación de cada categoría activa y puntuada. Plantilla genérica `RadarChart` en `shared/ui/charts/RadarChart/` (reutiliza `useEChart`; modo compacto en móvil para que quepan nombres largos). Lógica en `assessments/ui/balance/` (`buildBalance`, `BalanceCard`): orden fijo del catálogo, escala 0-10, mínimo tres categorías, lista de las que faltan por puntuar, descripción textual y "Ver datos". Sin endpoint nuevo; carga diferida.

### Corregido (RF-15)

- `escapeHtml` para los tooltips de ECharts, que se pintan como HTML: los nombres de categoría (que puede crear el admin) ya no pueden inyectar HTML.
- Tests intermitentes con toda la batería en paralelo (flujo de consentimiento, gráficos diferidos de Inicio): espera asíncrona de Testing Library de 1 s a 3 s en `tests/setup.ts`.

### Añadido (infraestructura)

- `.github/workflows/supabase-keep-alive.yml`: una consulta diaria mínima (solo lectura, clave pública *anon*, sin permisos sobre el repositorio) para que Supabase Free no pause el proyecto por inactividad; si Supabase no responde 200, el job falla y GitHub avisa. Necesita los secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` y que la rama por defecto sea `develop` (ver ADR-03 apartado 6.1).

### Cambiado (estructura y nombres)

- Gráficos reorganizados como plantillas genéricas en `src/shared/ui/charts/`: `TimeLineChart` (configurable por props), `useEChart`, `echarts.ts`, `timeWindow.ts`, `ChartDataTable`. Lo específico de la evolución, en `assessments/ui/evolution/` (`EvolutionPanel`, `PeriodSelector`, `CategoryEvolutionCard`, `scoreHistory`). Inicio dividido en `panel/ui/home/` (`Home`, `FirstTimeWelcome`, `LoadErrorState`, `Dashboard`).
- Recomendaciones (RF-18): la nota en la tarjeta pasa a un botón destacado "Una idea para ti" que abre una ventana con la idea y el aviso de RES-05 (`RecommendationButton`; se elimina `RecommendationNote`).
- Identificadores en inglés en todo lo tocado: `InterviewPage` (≈60 nombres, p. ej. `borradores` → `draftScores`, estados `listo/guardando/guardado` → `idle/saving/saved`), `InterviewHistory`, `Header` (`onCerrarSesion` → `onLogout`), `ResultsPage`, `ScoreCards` (`resultados/extraFor` → `latestScores/renderCardExtra`) y sus tests. Renombrado con el servicio de lenguaje de TypeScript (solo identificadores reales, respetando el ámbito).

### Añadido (RF-16)

- **RF-16** — evolución temporal de cada categoría ([historia](docs/user-stories/RF-16-evolucion-temporal.md)), que cierra RN-03 (Must). En Inicio, `EvolutionCards` (dos columnas): una tarjeta por categoría activa con su puntuación actual y un gráfico de líneas con **Apache ECharts** (`CategoryTrendChart`; nueva dependencia `echarts`, importación por partes y carga diferida: ~175 kB comprimidos solo en Inicio). Eje 1-10 fijo y eje por meses con la misma ventana para todas las tarjetas, elegida con un selector 6 meses / 12 meses / Todo y flechas de periodo (6 meses por defecto en móvil). Tooltip con puntuación y fecha, descripción textual y tabla "Ver datos" como alternativa accesible. Lógica pura en `trendChart.ts` (`periodWindow`, `buildTrendOption`). `buildCategoryTimeSeries` transforma el historial existente (`GET /api/assessments/history`): sin endpoint nuevo, 10 de 12 funciones. Resultados conserva las tarjetas de detalle y se enlaza desde Inicio.

### Añadido (RF-14)

- **RF-14** — panel general en `/inicio` ([historia](docs/user-stories/RF-14-panel-general.md)): formaliza y cierra lo ya construido durante RF-18 — una tarjeta por categoría activa con su última puntuación, compuesta con su recomendación abierta si la hay. Sin caso de uso `ConsultarPanelGeneral` combinado en el servidor a propósito (ver "Nota de diseño" de la historia): se compone en `Home.tsx` a partir de `GetLatestScores` y `ListRecommendations`, ya independientes y cacheados. RF-15 (radar), RF-16 (evolución) y RF-17 (puntuación global) quedan fuera — RN-03 (evolución histórica) traza a RF-16, no a RF-14.

### Corregido (RF-14)

- `Home`: un fallo al cargar las puntuaciones se mostraba con el texto de bienvenida de "primera vez" ("Empecemos por conocerte"), confundiendo un error técnico con un usuario nuevo. Ahora tiene su propio estado, con aviso y botón para reintentar.

### Cambiado (RF-10 / RF-14 / RF-39)

- Entrevista: cada categoría activa sin responder lleva la etiqueta "Sin responder" (lila suave, sin tono de alarma) y hay una fila de accesos directos a cada pregunta; la pantalla se titula "Tu entrevista" solo la primera vez y "Actualiza tus respuestas" después. En Inicio y Resultados el acceso pasa de "Nueva entrevista"/"Hacer una entrevista" a "Actualizar mis respuestas" cuando ya hay respuestas.
- Colores planos en vez de degradados (bandas de puntuación y fondo de la entrevista); `BAND_GRADIENTS` eliminado.
- Cabecera: enlace "Inicio", a la izquierda de "Administración".

### Eliminado

- `panel.nuevaEntrevista` (i18n), sustituida por `entrevista.actualizarRespuestas`.

- `panel.descripcion` (i18n): texto residual del placeholder de `Home` anterior a RF-14 ("Tu panel llegará pronto…"), sin ningún uso ya en el código.

### Añadido (RF-18)

- **RF-18** — recomendaciones ([historia](docs/user-stories/RF-18-recomendaciones.md)). Módulo `recommendations`: entidad `Recommendation` (RD-04, estado ya modelado; solo se crea `pending`), catálogo curado de plantillas por categoría estándar (2 cada una) y generales de reserva para las que cree el admin, umbral por variable de entorno `RECOMMENDATION_THRESHOLD` (defecto 5), `GenerateRecommendations` (como mucho una abierta por categoría, rotación de plantillas) y `ListRecommendations` (solo mientras la categoría está activa y la puntuación sigue bajo el umbral). `RecordAssessments` avisa a un oyente opcional después de persistir (equivalente en proceso del evento de dominio, sin Outbox); un fallo se registra y no deshace el guardado. Tabla `recommendations` (`supabase/migrations/0007_recommendations.sql`), `GET /api/recommendations` (10 de 12 funciones), nota discreta "Una idea para ti" en las tarjetas de Inicio y Resultados con el aviso de RES-05 y textos ES/EN. Cubierta por RF-05: se exporta y se borra con la cuenta.

### Añadido (ADM-03)

- **ADM-03** — el admin gestiona cuentas de otros usuarios: cambiar rol, suspender/reactivar (bloqueo de Supabase + rechazo de sesiones abiertas), eliminar (reutiliza el borrado de RF-05, `EraseUser`), crear con contraseña temporal mostrada una sola vez, cambiar email/nombre y enviar enlace de recuperación. Las acciones sensibles piden la contraseña del propio admin; nadie cambia su rol, y no se suspende ni elimina a un administrador (siempre debe existir uno). Auditoría en la tabla `admin_audit_log` (`supabase/migrations/0006_admin_audit_log.sql`: solo inserción, sin datos personales), con los fallos de contraseña anotados; los 403 van al log operativo. Handlers en `src/shared/infrastructure/http/handlers/admin/` servidos desde `api/admin/[action].ts` (una función). `/admin` gana las pestañas Usuarios (rediseñada) y Auditoría. `ListUsers` incluye el nombre y si la cuenta está suspendida.

### Añadido (RF-05)

- **RF-05 / RNF-12** — exportar y eliminar mis datos ([historia](docs/user-stories/RF-05-exportar-eliminar-datos.md)). `ExportUserData` devuelve un JSON descargable (cuenta, perfil, categorías, consentimientos y evaluaciones con nombres, fecha y versión del formato); `DeleteAccount` exige la contraseña (comprobada en el servidor con el email de la sesión), borra evaluaciones → categorías → consentimientos → perfil y por último la cuenta de acceso (repetible si algo falla), y borra la cookie. Nuevos métodos en los puertos: `deleteByUserId` (evaluaciones, categorías, perfil), `buscarPorUsuario`/`eliminarPorUsuario` (consentimientos), `eliminarUsuario` (`AuthProvider`). Acciones `export-data` y `delete-account` en `api/accounts/[action].ts` (sin funciones nuevas). Pantalla `/perfil/datos` ("Privacidad y datos") con cuadro de confirmación. El derecho al olvido prevalece sobre la inmutabilidad de RF-12. El único administrador no puede eliminar su cuenta (409, mensaje propio): siempre debe existir uno; se comprueba en el caso de uso antes de pedir la contraseña.

### Añadido (panel de administración)

- `npm run check:api` (`scripts/check-api-types.mjs`): compila `api/` como lo hace Vercel (config leída sin `extends`, `nodenext` por defecto), para detectar antes de subir el fallo de despliegue de `api/tsconfig.json`.
- **ADM-02** — catálogo global de categorías gestionable por el admin: tabla `category_catalog` (`supabase/migrations/0005_category_catalog.sql`, con las 9 estándar), casos de uso `ListCatalog`/`AddCatalogCategory`/`RetireCatalogCategory`, endpoints `api/admin/categories` y `api/admin/categories/retire`, pestaña "Categorías" en `/admin`. Añadir: la categoría llega inactiva a todos los usuarios al listar (`ListCategories` ahora sincroniza con el catálogo). Retirar: se marca `retired_at` (no se borra), se desactiva en todos los usuarios, `ActivateCategory` la rechaza y las puntuaciones guardadas se conservan. `requireAdmin` compartido (`shared/domain/Actor.ts`); `ForbiddenError` → 403.

- **ADM-01 (propuesto)** — primer corte: `/admin` y `GET /api/admin/users` (lista de usuarios: email, rol, alta, último acceso) solo para `admin`. El rol se lee de la sesión verificada en el servidor; `ListUsers` lo vuelve a comprobar (`ForbiddenError` → 403) y la interfaz (enlace en el `Header`, `AdminRoute`) es solo comodidad. Sin datos de contenido de los usuarios. `SessionContext` expone `rol`.

### Cambiado

- Rendimiento percibido: caché de lecturas con `@tanstack/react-query` (categorías, últimas puntuaciones e historial: volver a una pantalla ya no repite las llamadas), marcar/desmarcar categorías no sensibles es optimista (se deshace si falla; las sensibles muestran un indicador), y `ProtectedRoute` pasa a ruta de diseño para que la sesión se consulte una sola vez y no en cada cambio de pantalla. Al guardar la entrevista, Resultados/Inicio se actualizan al instante. La caché no caduca por tiempo (solo se vuelve a pedir tras una acción que cambie esos datos o al recargar), se vacía al iniciar sesión/registrarse y también cubre el perfil y el panel de administración (usuarios y catálogo).

- Registro (RF-01): tras crear la cuenta el servidor deja la sesión iniciada (`cookieDeSesion` compartida con el login) y el usuario va directo a `/inicio`; si el inicio de sesión fallara, se muestra el mensaje anterior con enlace a `/login`.
- Entrevista (RF-10): categorías en dos columnas (las sensibles aparte, con explicación del consentimiento; "Seleccionar todas" solo afecta a la otra) y aside con el historial de cambios (`GetAssessmentHistory`, `GET /api/assessments/history`: cada guardado con "antes → ahora").

- Entrevista editable: ya no hay que "hacer una entrevista nueva". Muestra las categorías activas con su última puntuación precargada; cambiar una puntuación inserta un registro nuevo (RF-12: nada se sobrescribe); marcar/desmarcar categorías las activa/desactiva (esto cubre la interfaz de desactivación que se había quitado).

- Entrevista (RF-10): las categorías se eligen y activan dentro de la propia entrevista (se elimina `CategoriesPage` y la ruta `/perfil/categorias`; el modal de consentimiento se traslada); icono de ejemplos por pregunta (desplegable en línea, textos ES/EN); los números dejan de colorearse y la respuesta recibe un degradado de fondo suave animado por banda (`BandBackground`, respeta `prefers-reduced-motion`). **Pendiente:** interfaz para desactivar categorías.
- `Home` (`/inicio`): primera vez (sin puntuaciones) → bienvenida con enlace grande a la entrevista; usuario recurrente → panel con tarjetas de resultados (adelanto de RF-14).

- `useSesion` se mueve de `modules/cuentas/ui/` a `shared/ui/` para que `ProtectedLayout` pueda usarlo sin invertir la dirección de dependencia entre `shared` y los módulos.
- Código y nombres de archivo en inglés a partir de ahora (comentarios/docs siguen en español) — aplicado a todo lo tocado en RF-03: `RegistrarUsuario`→`RegisterUser`, `RegistroForm`→`RegisterForm`, `Perfil`→`Profile`, `ConfigurarPerfil`→`UpdateProfile`, `ObtenerPerfil`→`GetProfile`, `LayoutProtegido`→`ProtectedLayout`, `api/registro.ts`→`api/register.ts`, `api/configurar-perfil.ts`→`api/profile.ts` (y, más tarde el 15 sept., toda la carpeta `api/` se reorganiza en subcarpetas — ver más abajo). El resto del código existente (no tocado en este cambio) se renombra cuando se toque, no en un pase retroactivo — ver AGENTS.md.
- `edad` (entero) sustituida por `birthDate` (fecha, selector nativo `<input type="date">`).
- `api/` reorganizado en subcarpetas por capacidad de negocio (`accounts/`, `categories/`, `consent/`), reflejando la estructura de `src/modules/` — Vercel sí soporta rutas anidadas de forma nativa (carpeta → segmento de URL); la duda sobre esto venía de un incidente anterior ya resuelto por otra causa (`SUPABASE_URL` mal configurada, ADR-06 apartado 2), no de un problema real con anidar carpetas. URLs afectadas: `/api/register`→`/api/accounts/register`, `/api/login`→`/api/accounts/login`, `/api/logout`→`/api/accounts/logout`, `/api/sesion`→`/api/accounts/session`, `/api/solicitar-recuperacion`→`/api/accounts/request-password-reset`, `/api/restablecer-password`→`/api/accounts/reset-password`, `/api/profile`→`/api/accounts/profile`, `/api/activate-category`→`/api/categories/activate`, `/api/deactivate-category`→`/api/categories/deactivate`, `/api/grant-consent`→`/api/consent/grant` (`/api/categories` sin cambios).
- Header consolidado: "Perfil" y "Categorías" eran dos enlaces sueltos, ahora es uno solo ("Mi perfil") hacia `AccountPage`, con un menú lateral (cajón fijo en md+, desplegable en móvil) que sustituye a las pestañas: Perfil, Categorías, Entrevista y Resultados (rutas anidadas `/perfil/*`, recargables/enlazables).
- Metodología: se abandonan los sprints semanales por Lean + Kanban con apetito fijo y línea de corte ([00_Metodologia_Lean.md](docs/project-management/00_Metodologia_Lean.md)); el backlog pasa a ser un tablero Kanban. `docs/user-stories/` se mantiene plano (una historia por archivo, sin carpetas por sprint).
- Playwright instalado (`e2e/`, `npm run test:e2e`, `tsconfig.e2e.json`) — primer test cubre solo páginas públicas (no toca `api/`). Automatizar RF-01 (registro/login) queda pendiente de decidir cómo aislar los datos de prueba en Supabase.

### Corregido

- Despliegue en Vercel rechazado por el plan Hobby ("No more than 12 Serverless Functions"): había 16 archivos en `api/`. Los handlers de `accounts/*` y `categories/activate|deactivate` pasan a `src/shared/infrastructure/http/handlers/` y se despachan desde `api/accounts/[action].ts` y `api/categories/[action].ts` con un pequeño `createRouter` (con test); las URLs no cambian. Quedan 9 funciones. `npm run check:api` avisa si se superan 12.

- Despliegue en Vercel fallaba al compilar las funciones de `api/` (TS2591 y TS2835 en `api/categories/index.ts`): Vercel busca el `tsconfig.json` subiendo desde la función y solo encontraba el de la raíz, que no tiene opciones (solo referencias), así que aplicaba su valor por defecto `nodenext` — que exige extensiones en los imports relativos y no localiza los tipos de Node. Se añade `api/tsconfig.json` **autocontenido** (resolución `bundler`, `types: ["node"]`). Un primer intento con `"extends": "../tsconfig.api.json"` no funcionó: Vercel lee el archivo sin resolver `extends`, así que veía un `compilerOptions` vacío y seguía cayendo en `nodenext` (45 errores en todas las funciones). Reproducido en local imitando ese comportamiento y comprobado con la versión autocontenida (0 errores).

- `RegisterUser` no aislaba el guardado del perfil inicial (`updateProfile`) del alta en Supabase Auth: una excepción ahí habría reportado el registro entero como fallido pese a que la cuenta ya existiera. Ahora va en su propio try/catch, sin poder deshacer un registro ya válido.
- Bug real encontrado en pruebas manuales: tras guardar el perfil, el `Header` seguía mostrando el email en vez del nombre recién guardado. `useSesion` (hook independiente, sin forma de invalidarse) se sustituye por `SessionProvider`/`useSession` (contexto de React) — `RutaProtegida` (renombrada `ProtectedRoute`) instala un único contexto por ruta que `ProtectedLayout` y `ProfileForm` comparten, así `ProfileForm` puede pedir un `refresh()` tras guardar.
- Bug real más profundo, mismo síntoma: `ProfileRepository`/`ConsentimientoRepository` en memoria no sobreviven entre funciones serverless distintas de `api/` (cada archivo es una función aislada, sin memoria compartida — ni en producción ni en `vercel dev`). Se adelanta su persistencia real a Supabase (`SupabaseProfileRepository`, `SupabaseConsentimientoRepository`) desde ahora, no en el Sprint 5 como estaba planeado — ver [04_Almacenamiento_Datos.md](docs/architecture-decisions/04_Almacenamiento_Datos.md) apartado 5.1. Esquemas en `supabase/migrations/`.
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
- `Breadcrumbs` y `Header` como componentes de navegación reutilizables en `shared/ui/` ([07_UI.md](docs/architecture-decisions/07_UI.md) apartado 5).
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
