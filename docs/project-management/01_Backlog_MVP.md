# Tablero del MVP (Ciclo 1) — Kanban con línea de corte

**Fecha:** 12 de septiembre de 2026 (reescrito el 19 de septiembre: de sprints semanales a Lean/Kanban)
**Relacionado con:** [00_Metodologia_Lean.md](00_Metodologia_Lean.md) (cómo se trabaja y por qué), [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md) (alcance del Ciclo 1), [03_Arquitectura_Software.md](../architecture-decisions/03_Arquitectura_Software.md), [04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md), [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)
**Plazo (apetito fijo):** 31 de octubre de 2026 (RES-01). El tiempo es fijo; lo que se ajusta es el alcance.
**Capacidad asumida:** 10-12 h/semana como base, con margen al alza. Es una referencia para decidir la línea de corte, no un compromiso repartido por semanas.

Cada tarea se especifica primero como historia de usuario Nivel 2 (Spec Anchored, en [docs/user-stories/](../user-stories/)) antes de implementarse, y se descompone en las capas de Clean Architecture (dominio → aplicación → infraestructura). Se empieza por el adaptador en memoria (tests) antes que Supabase real — salvo que el dato vaya a cruzar entre distintas funciones de `api/`, en cuyo caso Supabase real se construye ya (ver "Reglas de flujo").

---

## En curso (límite WIP: 2)

_(vacío — se tira la siguiente tarea de "Listo" cuando se decide empezar)_

## Listo (ordenado por riesgo y dependencias — se tira de arriba)

- [ ] **Validación** — Usability test (n=1, ver [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md)) sobre el flujo completo, centrado en RN-04; corregir lo que salga; preparar la demo de cierre del Ciclo 1. Se reserva tiempo para esto **siempre**: es lo último que se recorta, no lo primero.

### ─── LÍNEA DE CORTE ─── (si el tiempo no llega, lo de abajo no se hace en el Ciclo 1)

- [ ] **RF-23** — Caso de uso `ConfigurarNotificaciones`. Ningún otro RF del Ciclo 1 depende de él.
- [ ] Primeras historias del Ciclo 2.

## Decisiones y deuda pendientes (no son tareas todavía; se convierten en una si duelen)

- **RF-19 (hecha / descartada / pospuesta)** — natural siguiente paso de RF-18 (Should): el estado ya está en el modelo y en la base de datos, solo falta la acción del usuario y su interfaz. Hoy una recomendación se oculta sola cuando la puntuación mejora, pero no se puede descartar. Decidir junto con el umbral configurable desde la interfaz (RF-18 lo lee de una variable de entorno) y RF-20.
- **RF-15 / RF-17** (radar de equilibrio, puntuación global ponderada — Should/Could): siguiente extensión natural del panel. Sin planificar; decidir según el tiempo que quede tras la validación.
- **Rendimiento del servidor** (medir antes de tocar): (a) alinear la región de las funciones de Vercel con la de Supabase (`regions` en `vercel.json`; Hobby permite una) — hoy por defecto es EE. UU. este; (b) validar la sesión sin llamar a Supabase en cada petición (`getClaims`/JWKS): ahorra un salto por llamada pero un usuario borrado o bloqueado seguiría siendo válido hasta que caduque el token (1 h) — decisión de seguridad, no solo de velocidad; (c) un endpoint que devuelva de una vez lo que la entrevista pide en tres llamadas; (d) menos funciones = menos arranques en frío ([03_Arquitectura_Software.md](../architecture-decisions/03_Arquitectura_Software.md) §6bis).
- **Validaciones previas al push con Husky** (idea): `pre-push` con lint, tests, `npm run build` y `npm run check:api`, para no descubrir en Vercel lo que se puede ver en local.
- **Aviso a usuarios de categorías nuevas/retiradas** (idea): depende de RF-23 (notificaciones, bajo la línea de corte) y de consentimiento a comunicaciones.
- **Métricas DORA y Flow:** revisión de calidad planificada antes de la validación; se simula DORA por cada PR fusionada a `develop` (producción = `main`, solo al completar el MVP) y se anota fecha de inicio/fin de cada tarea ([02_Metricas_DORA_y_Flujo.md](02_Metricas_DORA_y_Flujo.md)).
- **Playwright contra `api/`** (RF-01 registro/login): decidir cómo aislar los datos de prueba en Supabase (proyecto dedicado o limpieza tras cada test) antes de automatizar nada que cree cuentas reales. Ver [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md) §1bis.
- **Header con tres o más enlaces**: hoy hay "Inicio" y "Mi perfil" (y "Administración" para el admin), más idioma y cerrar sesión; en móvil puede quedar justo. Con uno más (o si se ve mal en la validación) hace falta un menú (hamburguesa en móvil) en vez de más botones.
- **Mobile-first retroactivo** de Landing/Login/Registro/Recuperar contraseña: funcionan, pero sin adaptación intencionada a tablet/escritorio ([07_UI.md](../architecture-decisions/07_UI.md) §6).
- **Renombrado a inglés** del código anterior al 14 sept.: solo cuando se toque por otro motivo (AGENTS.md).
- **Política de privacidad**: borrador de TFM, no revisado legalmente ([PrivacyPolicyPage](../../src/pages/PrivacyPolicyPage.tsx)).

## Hecho

Detalle en [docs/user-stories/](../user-stories/) y en el [CHANGELOG](../../CHANGELOG.md); aquí solo el resumen.

- [x] **Cimientos:** estructura mínima por módulo, Vitest + Zod + alias, Composition Root (`container.ts`), proyecto de datos inicial (luego sustituido por Supabase), **RF-30** (líneas de ayuda en crisis: lógica hecha; falta su pantalla visual).
- [x] **RF-01** registro y login sobre Supabase Auth (cookie httpOnly) — [registro](../user-stories/RF-01-registro.md), [login](../user-stories/RF-01-login.md).
- [x] **RF-39** routing real (Landing pública, área protegida) — [historia](../user-stories/RF-39-navegacion.md).
- [x] **RF-38** recuperación de contraseña — [historia](../user-stories/RF-38-recuperar-password.md).
- [x] **RNF-10** i18n ES/EN ([ADR-09](../architecture-decisions/09_Internacionalizacion.md)), `Breadcrumbs`/`Header` reutilizables ([ADR-07](../architecture-decisions/07_UI.md)).
- [x] **RF-04** consentimiento explícito y versionado por política — [historia](../user-stories/RF-04-consentimiento.md); con disparador real (`ActivateCategory`) y `PrivacyPolicyPage`.
- [x] **RNF-13** roles de usuario (`usuario`/`premium`/`admin`) en `app_metadata` de Supabase ([ADR-06](../architecture-decisions/06_Autenticacion.md) §1bis).
- [x] **RF-03** perfil (nombre, fecha de nacimiento, género opcional, zona horaria) — [historia](../user-stories/RF-03-configurar-perfil.md); `name` se captura en el registro.
- [x] **RF-06 / RF-07** catálogo de 9 categorías y activación individual — [historia](../user-stories/RF-06-RF-07-categorias.md).
- [x] **RF-10** entrevista personal (los requisitos la llaman check-in): `Score` (1-10), `Assessment` inmutable, `RecordAssessments` (todo o nada, con nota opcional, puntuación parcial), `GetLatestScores`, Supabase real (`0004_assessments.sql`), `api/assessments`, pantallas `/perfil/entrevista` (con categorías integradas y ejemplos por pregunta) y `/perfil/resultados` (fondo suave por banda) — [historia](../user-stories/RF-10-entrevista.md). Sin periodos (RF-09) ni recomendaciones (RF-18) todavía.
- [x] **RF-05** exportar y eliminar mis datos (Must, derecho al olvido; RNF-12): `ExportUserData` (JSON con todo, con nombres) y `DeleteAccount` (exige la contraseña, borra datos y luego la cuenta de acceso, repetible), sección "Privacidad y datos" en Mi perfil — [historia](../user-stories/RF-05-exportar-eliminar-datos.md).
- [x] **RF-18** recomendaciones (Must): módulo `recommendations` (entidad, catálogo curado de plantillas por categoría con generales de reserva, umbral configurable `RECOMMENDATION_THRESHOLD`, `GenerateRecommendations` como oyente de `RecordAssessments`, `ListRecommendations`), Supabase real (`0007_recommendations.sql`), `GET /api/recommendations`, nota "Una idea para ti" en Inicio y Resultados con el aviso de RES-05; cubierta por RF-05 — [historia](../user-stories/RF-18-recomendaciones.md). Sin marcar como hecha/descartada/pospuesta (RF-19).
- [x] **ADM-01 (propuesto, primer corte)** panel de administración: `/admin` y `GET /api/admin/users` solo para rol `admin` (control de acceso en servidor y en el caso de uso, `ForbiddenError`), lista de usuarios — [historia](../user-stories/ADM-01-panel-administracion.md). Falta registrarlo en los requisitos.
- [x] **ADM-02** catálogo de categorías gestionable por el admin (añadir / retirar sin borrar), `0005_category_catalog.sql`, pestaña Categorías en `/admin` — [historia](../user-stories/ADM-02-catalogo-categorias.md).
- [x] **ADM-03** gestión de usuarios por el admin: cambiar rol, suspender/reactivar, eliminar, crear (contraseña temporal), cambiar email/nombre, enviar enlace de recuperación; contraseña del admin en lo sensible, regla "siempre un administrador", auditoría en `admin_audit_log` (`0006_admin_audit_log.sql`) — [historia](../user-stories/ADM-03-gestion-usuarios.md).
- [x] **RF-14** panel general (`/inicio`): una tarjeta por categoría activa con su última puntuación, compuesta con su recomendación abierta si la hay (RF-18); sin caso de uso combinado en el servidor, se compone en `Home.tsx` (ver nota de diseño de la historia); corrige además un fallo real: un error al cargar las puntuaciones se mostraba con el texto de "primera vez" — [historia](../user-stories/RF-14-panel-general.md). RF-15 (radar), RF-16 (evolución) y RF-17 (puntuación global) quedan fuera, a planificar aparte.
- [x] **RF-16** evolución temporal (cierra **RN-03**, Must): en Inicio, una tarjeta por categoría activa con su puntuación actual y un gráfico de líneas con Apache ECharts (carga diferida; pequeños múltiplos en dos columnas, eje 1-10 y ventana de meses común con selector 6/12 meses/Todo), tooltip, descripción textual y tabla "Ver datos"; reutiliza `GET /api/assessments/history` (sin funciones nuevas). Inicio y Resultados dejan de ser iguales — [historia](../user-stories/RF-16-evolucion-temporal.md).
- [x] **Estructura:** `api/` por capacidad de negocio, `shared/ui/` por tipo, pantalla "Mi perfil" con menú lateral (Perfil, Entrevista, Resultados), Playwright instalado (solo páginas públicas).

---

## Reglas de flujo

- **Se tira, no se empuja:** la siguiente tarea se elige de arriba de "Listo" solo cuando hay hueco en "En curso" (WIP ≤ 2, una sola persona).
- **Orden por riesgo y dependencias, no por numeración de RF** (mismo criterio del espiral, [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md)): sin cuenta + consentimiento no se puede probar nada del resto de forma honesta.
- **Datos que cruzan funciones de `api/`** → persistencia real (Supabase) desde el principio; los adaptadores en memoria solo valen para tests y para casos de uso sin endpoint propio. Cada archivo de `api/` es una función serverless aislada, sin memoria compartida ([04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md) §7bis).
- **La línea de corte se revisa** cada vez que una tarea se cierra: ¿el tiempo restante hasta el 31 oct. cubre lo que queda por encima de la línea? Si no, se baja una tarea por debajo — nunca se estira el plazo.
- **Trabajo transversal** (renombrados, reorganizaciones, herramientas) solo entra si desbloquea o abarata lo que hay en "Listo"; si no, va a "Decisiones y deuda".

---

## Historial de cambios

- **v1.0-v1.12 (12-15 sept. 2026)** — versión inicial en sprints semanales (Sprint 0 a 6) y su seguimiento hasta cerrar Sprint 1 y RF-03/RF-06/RF-07 del Sprint 2. El detalle de qué se hizo cada día está en el [CHANGELOG](../../CHANGELOG.md).
- **v2.1 (19 sept. 2026)** — RF-10 (check-in) hecho de extremo a extremo; plan de métricas DORA y Flow añadido como revisión de calidad futura.
- **v2.0 (19 sept. 2026)** — se abandonan los sprints semanales por Lean/Kanban con línea de corte ([00_Metodologia_Lean.md](00_Metodologia_Lean.md)). Nunca hubo Scrum propiamente dicho (roles, ceremonias, velocidad): los "sprints" eran solo un calendario semanal para una persona. El espiral (ciclo de vida) se mantiene. El colchón del antiguo Sprint 6 pasa a ser la línea de corte + el hueco reservado de validación.
- **v2.2 (19 sept. 2026)** — RF-10 rediseñada: "Entrevista" (puntuación parcial, seleccionar todas), vista de Resultados con colores, y Mi perfil pasa de pestañas a menú lateral.
- **v2.3 (19 sept. 2026)** — categorías integradas en la entrevista, ejemplos por pregunta, degradado animado en vez de colores en números, Home distingue primera vez de usuario recurrente.
- **v2.4 (19 sept. 2026)** — la entrevista pasa a ser editable (sin entrevistas nuevas; cambios como registros nuevos) y absorbe la desactivación de categorías; primer corte del panel de administración (ADM-01, propuesto).
- **v2.5 (19 sept. 2026)** — registro con sesión iniciada; entrevista en dos columnas con historial de cambios; diseño de ADM-02 (catálogo) propuesto.
- **v2.6 (19 sept. 2026)** — ADM-02 implementada (decisiones confirmadas).
- **v2.7 (20 sept. 2026)** — caché de lecturas en el cliente, interfaz optimista en categorías, sesión única entre pantallas; límites de Vercel Hobby documentados; rendimiento del servidor anotado como pendiente.
- **v2.8 (20 sept. 2026)** — RF-05 hecha (exportar y eliminar datos, con confirmación por contraseña).
- **v2.9 (20 sept. 2026)** — regla "siempre debe existir un administrador" en el borrado de cuenta; diseño de ADM-03 propuesto.
- **v2.10 (20 sept. 2026)** — ADM-03 implementada.
- **v2.11 (20 sept. 2026)** — RF-18 hecha (recomendaciones al puntuar bajo); RF-19 anotada como siguiente paso natural.
- **v2.12 (26 sept. 2026)** — RF-14 hecha (panel general: estado actual + recomendación por categoría, sin caso de uso combinado); RF-15/RF-16/RF-17 anotadas como extensión futura sin planificar.
- **v2.13 (26 sept. 2026)** — RF-16 hecha (evolución temporal); con ella quedan cerrados todos los Must del Ciclo 1 salvo la validación. RF-15/RF-17 siguen sin planificar.
