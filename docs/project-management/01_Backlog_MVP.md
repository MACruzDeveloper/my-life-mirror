# Tablero del MVP (Ciclo 1) — Kanban con línea de corte

**Fecha:** 12 de septiembre de 2026 (reescrito el 19 de septiembre: de sprints semanales a Lean/Kanban)
**Relacionado con:** [00_Metodologia_Lean.md](00_Metodologia_Lean.md) (cómo se trabaja y por qué), [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md) (alcance del Ciclo 1), [03_Arquitectura_Software.md](../architecture-decisions/03_Arquitectura_Software.md), [04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md), [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)
**Plazo (apetito fijo):** 31 de octubre de 2026 (RES-01). El tiempo es fijo; lo que se ajusta es el alcance.
**Capacidad asumida:** 10-12 h/semana como base, con margen al alza. Es una referencia para decidir la línea de corte, no un compromiso repartido por semanas.

Cada tarea se especifica primero como historia de usuario Nivel 2 (Spec Anchored, en [docs/user-stories/](../user-stories/)) antes de implementarse, y se descompone en las capas de Clean Architecture (dominio → aplicación → infraestructura). Se empieza por el adaptador en memoria (tests) antes que Supabase real — salvo que el dato vaya a cruzar entre distintas funciones de `api/`, en cuyo caso Supabase real se construye ya (ver "Reglas de flujo").

---

## En curso (límite WIP: 2)

- [ ] **UX-06** distribución de la entrevista y menú plegable (desde el 4 oct.; [historia](../user-stories/UX-06-distribucion-entrevista-menu.md)): al actualizar, "Tus categorías" y "Requieren tu consentimiento" en acordeones (columna derecha en escritorio, encima de las preguntas en móvil), y el menú de Mi perfil como `Drawer` plegable a iconos.

- [ ] **PERF-01** menos llamadas al guardar en la entrevista (desde el 4 oct.; [historia](../user-stories/PERF-01-menos-llamadas-guardar.md)): el `POST /api/assessments` devuelve las últimas puntuaciones y las recomendaciones; de 4 llamadas a 2 por guardado y el modal de la idea en la mitad de tiempo (medido en local). GraphQL descartado.
- [ ] **UX-07** primera entrevista por pasos (desde el 4 oct.; [historia](../user-stories/UX-07-primera-entrevista-pasos.md)): introducción → categorías con botones (sensibles aparte, con consentimiento) → preguntas, con indicador de pasos. Solo la primera vez.

## Listo (ordenado por riesgo y dependencias — se tira de arriba)

Plan del Ciclo 2 acordado el 29 sept. (una PR por historia):

- [ ] **RF-42** situaciones que lo ponen difícil (nuevo, Should): con puntuación baja, la entrevista pregunta "¿Qué te lo pone difícil?" con una lista cerrada de situaciones (no rasgos ni salud); las ideas que choquen no se proponen, tampoco por IA. Sustituye la idea aplazada del 29 sept.
- [ ] **RF-43** lo que funciona a otros (nuevo, Could): con puntuación alta, agregado anónimo de las opciones de RF-41 de quienes van bien en esa categoría, con tamaño mínimo de grupo y posibilidad de excluirse. Primer paso, ligero y sin texto libre, hacia RF-32/RF-33.
- [ ] **RF-40b** adaptador real de Anthropic (Claude Haiku) y evaluación con el modelo — cuando haya crédito de API. PR 4.
- [ ] **RF-30** pantalla de líneas de ayuda: enlace discreto y permanente "¿Necesitas ayuda ahora?". La respuesta ética a "¿y si alguien escribe que no puede más?": ayuda ofrecida a todos, sin detectar nada (RES-09). La lógica ya existe. PR 5 (opcional, recomendado).
- [ ] **Demo final** — al terminar el proyecto, para la revisión de los profesores (no antes: solo revisan el proyecto terminado). [Guion](../validation/04_Guion_Demo_Cierre.md) ya preparado; se actualiza entonces con lo que haya del Ciclo 2.

### ─── LÍNEA DE CORTE ─── (si el tiempo no llega, lo de abajo no se hace en el Ciclo 1)

- [ ] **RF-23** — Caso de uso `ConfigurarNotificaciones`. Ningún otro RF del Ciclo 1 depende de él.
- [ ] Más ideas del Ciclo 2 que salen de la validación (27 sept.), pendientes de convertirse en RF (la pregunta por categoría ya es RF-41 y las sugerencias, RF-40):
  - **Perfil ampliado** tras el registro: aficiones, estado civil, hijos (y sus edades o necesidades especiales), ubicación, peso/altura, salud, religión… Hoy RF-03 solo tiene nombre, fecha de nacimiento, género y zona horaria. **Salud y religión son datos de categoría especial (RGPD art. 9):** solo con consentimiento explícito (como las categorías sensibles), cada campo opcional y ligado a un uso concreto (minimización). Su uso con IA sigue sujeto a RD-09 y RES-09.

## Decisiones y deuda pendientes (no son tareas todavía; se convierten en una si duelen)

- **RF-19 (hecha / descartada / pospuesta)** — natural siguiente paso de RF-18 (Should): el estado ya está en el modelo y en la base de datos, solo falta la acción del usuario y su interfaz. Hoy una recomendación se oculta sola cuando la puntuación mejora, pero no se puede descartar. Decidir junto con el umbral configurable desde la interfaz (RF-18 lo lee de una variable de entorno) y RF-20.
- **RF-17** (puntuación global ponderada, Could): sin planificar; decidir según el tiempo que quede tras la validación. (RF-15 ya está hecho.)
- **Aviso a usuarios de categorías nuevas/retiradas** (idea): depende de RF-23 (notificaciones, bajo la línea de corte) y de consentimiento a comunicaciones.
- **Campos JSON de la API en español** (`autenticado`, `sesionIniciada`, `rol`, `creadoEn`, `ultimoAcceso`, `suspendido`, `mensaje`): lo único del código que sigue en español sin ser dato guardado. Cambiarlos exige tocar servidor, cliente y tests a la vez; se hará en una PR aparte si compensa.
- **Validación ética con el tutor** (pendiente, sin fecha): comentar el enfoque de RF-29/RES-09 (sugerir apoyo profesional sin detección algorítmica de riesgo), por si el máster exige alguna revisión ética adicional al tratarse de bienestar emocional. Pesa más ahora con RF-40 (IA). Venía de los "Próximos pasos" de los requisitos.
- **`requestId` en los logs** (idea): un id por petición para seguirla entre funciones distintas en los logs de Vercel. Venía del "Próximo paso" de ADR-08.
- **Contenido editable desde `/admin`** (idea, ADM-04; después de RF-40a, decidido el 29 sept.): el catálogo de ideas (con traducciones y etiquetas de situación), las opciones de "¿Qué te ayuda?" y las situaciones a evitar pasan a la base de datos, editables como las categorías de ADM-02 (retirar, nunca borrar: los usuarios guardan sus claves). Es lo que ya pedía RD-09 ("catálogo gestionable sin tocar código").
- **Volver a ejecutar los E2E con `api/` en todas las PRs** (a final de octubre): quitar `branches: [main]` en `.github/workflows/e2e-api.yml`. Hasta entonces solo en las PRs a `main`, a petición del autor (tardaban en cada PR).
- **Política de privacidad**: borrador de TFM, no revisado legalmente ([PrivacyPolicyPage](../../src/pages/PrivacyPolicyPage.tsx)).

## Hecho

- [x] **UX-05** respuesta inmediata en la entrevista ([historia](../user-stories/UX-05-respuesta-inmediata-entrevista.md)): un "Guardar" por categoría, a la derecha de la puntuación; "Guardado ahora" en la categoría o, si el guardado abre una idea nueva, una ventana con ella; carrusel con las 5 ideas de la categoría y "Ideas para X" en la pregunta (con RF-40, se reescriben al cambiar "¿Qué te ayuda?", RF-40 v1.1); la última actualización y la última experiencia bajo cada pregunta; panel de progreso en la columna derecha; el historial pasa a Resultados, agrupado por día. Petición del autor (3 oct.): "si no, el usuario no sabe qué ha pasado".
- [x] **RF-40a** ideas personalizadas con IA contra un *Fake*: interruptor voluntario, la IA reescribe una idea del catálogo (ampliado a 5 por categoría) con filtro y caída al texto curado — [historia](../user-stories/RF-40-ideas-personalizadas-ia.md) (Nivel 3). Las 27 ideas nuevas, pendientes de una revisión a fondo del autor.
- [x] **Imports `#shared`/`#modules`** en el código del servidor, probados con un `vercel build` real antes de convertir 265 imports.
- [x] **RF-41** experiencias por categoría: "¿Qué te ayuda?" (opciones cerradas, guardado al momento) y la nota como "Tu experiencia (privada)" — [historia](../user-stories/RF-41-experiencias-categoria.md).
- [x] **UX-04** historial de cambios plegado, con línea de tiempo por meses — [historia](../user-stories/UX-04-historial-plegable.md).
- [x] **Primera entrega a producción** (29 sept.): v1.0.0 y v1.0.1 en https://my-life-mirror.vercel.app, con el *smoke* de producción tras cada despliegue.
- [x] **Métricas DORA y Flow** (primera revisión, 29 sept.): 11 PRs, 1 fallo que llegó a `develop` (5 más parados antes de fusionar), *flow time* mediano de 0 días y dos reglas de flujo nuevas — [resultados](02_Metricas_DORA_y_Flujo.md) apartado 7.
- [x] **E2E con `api/` en GitHub Actions** (`E2E con api`, en cada PR, sin secretos) y **`npm run dev:local`** para probar la app completa contra el Supabase local; README reescrito para quien quiera probarla.
- [x] **Playwright contra `api/`**: Supabase local en Docker, servidor propio en Vite con salvaguarda (nunca la base real) y aislamiento entre funciones; 9 tests × móvil/escritorio sobre RF-01, RF-04, RF-05, RF-10, RF-14, RF-15, RF-18, RF-39, UX-01 y UX-02 (`npm run test:e2e:api`, [plan de V&V](../requirements-analysis/04_Plan_Verificacion_Validacion.md) apartado 1.2).
- [x] **Rendimiento del servidor**: funciones de Vercel en Dublín (`dub1`, `vercel.json`), junto a Supabase (Irlanda); antes, en Washington. `getClaims` descartado (un usuario borrado seguiría entrando hasta 1 h) y endpoint combinado de la entrevista aplazado hasta medir ([03_Arquitectura_Software.md](../architecture-decisions/03_Arquitectura_Software.md) apartado 6.1). **Pendiente de medir** en la próxima *preview* (las *previews* piden login de Vercel y aún no hay producción).
- [x] **UX-03** menú de la cabecera en móvil: logo + idioma + menú (Inicio, Administración si es admin, Mi perfil, nombre, Cerrar sesión); desde `sm`, como antes — [historia](../user-stories/UX-03-menu-cabecera-movil.md).
- [x] **Mobile-first de las páginas públicas**: registro, login, recuperar y restablecer contraseña con margen lateral en móvil (los campos tocaban el borde) y alineados con las migas (`PublicFormBox`, compartido); portada con margen superior adaptable. Comprobado en navegador a 360 y 1280 px.
- [x] **Quality gates con Husky**: `pre-commit` (lint + typecheck, ~7 s) y `pre-push` (`npm run verify`: lint, tests con umbral de cobertura en dominio + aplicación, build, `check:api`, e2e; ~40 s). Comprobado que una función de dominio sin test bloquea la subida. Se valida de verdad con la próxima PR.
- [x] **Validación** (26-27 sept.): sesión con el [guion corto](../validation/03_Short_Test_Script_EN.md), [resultados](../validation/02_Resultados_Test_Usabilidad.md); RN-04 se cumple según lo declarado; problemas corregidos con UX-01 y UX-02.
- [x] **UX-02** destacar las propuestas (gravedad 2 de la validación): banda en texto junto a la puntuación en cada tarjeta del panel y resumen "Ideas para ti" arriba del panel con un botón por idea. Frases inspiradoras e ideas con IA quedan fuera (pendientes de decidir) — [historia](../user-stories/UX-02-destacar-propuestas.md).
- [x] **UX-01** guía de primer uso (gravedad 3 de la validación): "Cómo funciona" en tres pasos en la portada y en la bienvenida de Inicio, pasos de la pantalla en la primera entrevista, y "Cómo leer esta página" en el panel (se cierra con "Entendido", se recuerda en el dispositivo y se puede reabrir) — [historia](../user-stories/UX-01-guia-primer-uso.md).
- [x] **Keep-alive de Supabase** (transversal, desbloquea la evaluación del TFM): workflow de GitHub Actions cada 5 días contra la pausa por inactividad del plan Free ([03_Arquitectura_Software.md](../architecture-decisions/03_Arquitectura_Software.md) apartado 6.1). Requiere dos secretos y la rama por defecto en `develop`.

Detalle en [docs/user-stories/](../user-stories/) y en el [CHANGELOG](../../CHANGELOG.md); aquí solo el resumen.

- [x] **Cimientos:** estructura mínima por módulo, Vitest + Zod + alias, Composition Root (`container.ts`), proyecto de datos inicial (luego sustituido por Supabase), **RF-30** (líneas de ayuda en crisis: lógica hecha; falta su pantalla visual).
- [x] **RF-01** registro y login sobre Supabase Auth (cookie httpOnly) — [registro](../user-stories/RF-01-registro.md), [login](../user-stories/RF-01-login.md).
- [x] **RF-39** routing real (Landing pública, área protegida) — [historia](../user-stories/RF-39-navegacion.md).
- [x] **RF-38** recuperación de contraseña — [historia](../user-stories/RF-38-recuperar-password.md).
- [x] **RNF-10** i18n ES/EN ([ADR-09](../architecture-decisions/09_Internacionalizacion.md)), `Breadcrumbs`/`Header` reutilizables ([ADR-07](../architecture-decisions/07_UI.md)).
- [x] **RF-04** consentimiento explícito y versionado por política — [historia](../user-stories/RF-04-consentimiento.md); con disparador real (`ActivateCategory`) y `PrivacyPolicyPage`.
- [x] **RNF-13** roles de usuario (`usuario`/`premium`/`admin`) en `app_metadata` de Supabase ([ADR-06](../architecture-decisions/06_Autenticacion.md) apartado 1.1).
- [x] **RF-03** perfil (nombre, fecha de nacimiento, género opcional, zona horaria) — [historia](../user-stories/RF-03-configurar-perfil.md); `name` se captura en el registro.
- [x] **RF-06 / RF-07** catálogo de 9 categorías y activación individual — [historia](../user-stories/RF-06-RF-07-categorias.md).
- [x] **RF-10** entrevista personal (los requisitos la llaman check-in): `Score` (1-10), `Assessment` inmutable, `RecordAssessments` (todo o nada, con nota opcional, puntuación parcial), `GetLatestScores`, Supabase real (`0004_assessments.sql`), `api/assessments`, pantallas `/perfil/entrevista` (con categorías integradas y ejemplos por pregunta) y `/perfil/resultados` (fondo suave por banda) — [historia](../user-stories/RF-10-entrevista.md). Sin periodos (RF-09) ni recomendaciones (RF-18) todavía.
- [x] **RF-05** exportar y eliminar mis datos (Must, derecho al olvido; RNF-12): `ExportUserData` (JSON con todo, con nombres) y `DeleteAccount` (exige la contraseña, borra datos y luego la cuenta de acceso, repetible), sección "Privacidad y datos" en Mi perfil — [historia](../user-stories/RF-05-exportar-eliminar-datos.md).
- [x] **RF-18** recomendaciones (Must): módulo `recommendations` (entidad, catálogo curado de plantillas por categoría con generales de reserva, umbral configurable `RECOMMENDATION_THRESHOLD`, `GenerateRecommendations` como oyente de `RecordAssessments`, `ListRecommendations`), Supabase real (`0007_recommendations.sql`), `GET /api/recommendations`, nota "Una idea para ti" en Inicio y Resultados con el aviso de RES-05; cubierta por RF-05 — [historia](../user-stories/RF-18-recomendaciones.md). Sin marcar como hecha/descartada/pospuesta (RF-19).
- [x] **ADM-01 (propuesto, primer corte)** panel de administración: `/admin` y `GET /api/admin/users` solo para rol `admin` (control de acceso en servidor y en el caso de uso, `ForbiddenError`), lista de usuarios — [historia](../user-stories/ADM-01-panel-administracion.md). Falta registrarlo en los requisitos.
- [x] **ADM-02** catálogo de categorías gestionable por el admin (añadir / retirar sin borrar), `0005_category_catalog.sql`, pestaña Categorías en `/admin`; multidioma desde el 27 sept. (traducciones por id, `0009_category_translations_table.sql`) — [historia](../user-stories/ADM-02-catalogo-categorias.md).
- [x] **ADM-03** gestión de usuarios por el admin: cambiar rol, suspender/reactivar, eliminar, crear (contraseña temporal), cambiar email/nombre, enviar enlace de recuperación; contraseña del admin en lo sensible, regla "siempre un administrador", auditoría en `admin_audit_log` (`0006_admin_audit_log.sql`) — [historia](../user-stories/ADM-03-gestion-usuarios.md).
- [x] **RF-14** panel general (`/inicio`): una tarjeta por categoría activa con su última puntuación, compuesta con su recomendación abierta si la hay (RF-18); sin caso de uso combinado en el servidor, se compone en `Home.tsx` (ver nota de diseño de la historia); corrige además un fallo real: un error al cargar las puntuaciones se mostraba con el texto de "primera vez" — [historia](../user-stories/RF-14-panel-general.md). RF-15 (radar), RF-16 (evolución) y RF-17 (puntuación global) quedan fuera, a planificar aparte.
- [x] **RF-15** radar de equilibrio: tarjeta "Tu equilibrio" encima de la evolución en Inicio; plantilla genérica `RadarChart` (hermana de `TimeLineChart`), orden fijo de ejes (catálogo), escala 0-10, mínimo tres categorías puntuadas, descripción textual y "Ver datos", nombres escapados en el tooltip — [historia](../user-stories/RF-15-radar-equilibrio.md).
- [x] **RF-16** evolución temporal (cierra **RN-03**, Must): en Inicio, una tarjeta por categoría activa con su puntuación actual y un gráfico de líneas con Apache ECharts (carga diferida; pequeños múltiplos en dos columnas, eje 1-10 y ventana de meses común con selector 6/12 meses/Todo), tooltip, descripción textual y tabla "Ver datos"; reutiliza `GET /api/assessments/history` (sin funciones nuevas). Inicio y Resultados dejan de ser iguales — [historia](../user-stories/RF-16-evolucion-temporal.md).
- [x] **Estructura:** `api/` por capacidad de negocio, `shared/ui/` por tipo, pantalla "Mi perfil" con menú lateral (Perfil, Entrevista, Resultados), Playwright instalado (solo páginas públicas).

---

## Reglas de flujo

- **Se tira, no se empuja:** la siguiente tarea se elige de arriba de "Listo" solo cuando hay hueco en "En curso" (WIP ≤ 2, una sola persona).
- **Orden por riesgo y dependencias, no por numeración de RF** (mismo criterio del espiral, [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md)): sin cuenta + consentimiento no se puede probar nada del resto de forma honesta.
- **Datos que cruzan funciones de `api/`** → persistencia real (Supabase) desde el principio; los adaptadores en memoria solo valen para tests y para casos de uso sin endpoint propio. Cada archivo de `api/` es una función serverless aislada, sin memoria compartida ([04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md) apartado 5.1).
- **La línea de corte se revisa** cada vez que una tarea se cierra: ¿el tiempo restante hasta el 31 oct. cubre lo que queda por encima de la línea? Si no, se baja una tarea por debajo — nunca se estira el plazo.
- **Una PR por historia** (como mucho dos, si dependen entre sí), **con commits por paso**: sin eso el plazo de entrega no se puede medir y el WIP real supera el límite ([métricas](02_Metricas_DORA_y_Flujo.md) apartado 7.6, 29 sept.).
- **Un aviso del compilador o de la plataforma se corrige en su causa**, no se silencia cambiando la configuración; si hay que cambiarla, se añade a la vez un control que cubra lo que el aviso vigilaba ([métricas](02_Metricas_DORA_y_Flujo.md) apartado 7.2, 29 sept.).
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
- **v2.14 (26 sept. 2026)** — RF-15 (radar) pasa a "Listo", por encima de la validación: hay tiempo y así el test de usabilidad cubre el panel definitivo.
- **v2.15 (26 sept. 2026)** — keep-alive de Supabase (GitHub Actions).
- **v2.16 (26 sept. 2026)** — RF-15 hecha (radar de equilibrio). Solo queda la validación por encima de la línea de corte.
- **v2.17 (26 sept. 2026)** — Validación pasa a "En curso", con guion y hoja de resultados preparados; la demo de cierre queda como tarea aparte en "Listo".
- **v2.18 (27 sept. 2026)** — ADM-02 ampliada: categorías con texto en cada idioma soportado, en tabla de traducciones resuelta por id (sustituye las columnas `name_en` del mismo día).
- **v2.19 (27 sept. 2026)** — sesión de validación hecha. Suben a "Listo": T5 (eliminar cuenta, gravedad 3), guía de primer uso (gravedad 3) y destacar las propuestas (gravedad 2). Tres ideas importantes para el Ciclo 2: perfil ampliado, pregunta abierta por categoría y sugerencias personalizadas.
- **v2.20 (27 sept. 2026)** — T5 descartada (la participante no quiso borrar su cuenta; el autor lo comprobó con la suya). UX-01 (guía de primer uso) hecha.
- **v2.21 (27 sept. 2026)** — UX-02 (destacar las propuestas) hecha. Todos los problemas de la validación corregidos; solo queda la demo por encima de la línea de corte.
- **v2.22 (27 sept. 2026)** — Validación pasa a "Hecho". RF-40 (recomendaciones personalizadas con IA) decidido para el Ciclo 2.
- **v2.23 (27 sept. 2026)** — a petición del autor, pasan de "Decisiones y deuda" al MVP (por encima de la demo): Husky, rendimiento del servidor, menú de la cabecera en móvil, mobile-first de las páginas públicas, Playwright contra `api/` y métricas DORA/Flow. Siguen como decisiones: RF-19, RF-17, aviso de categorías nuevas (depende de RF-23), renombrado a inglés (regla del boy scout) y la política de privacidad.
- **v2.24 (27 sept. 2026)** — Husky hecho (quality gates en pre-commit y pre-push, con cobertura).
- **v2.25 (27 sept. 2026)** — hechos: región de las funciones (dub1), menú móvil (UX-03) y mobile-first de las páginas públicas. Quedan Playwright contra `api/` (decisión de aislamiento primero), métricas DORA/Flow y la demo.
- **v2.26 (27 sept. 2026)** — Playwright contra `api/` hecho (Docker). Quedan métricas DORA/Flow y la demo.
- **v2.27 (28 sept. 2026)** — E2E con `api/` en GitHub Actions, `dev:local` y README.
- **v2.28 (29 sept. 2026)** — métricas DORA/Flow revisadas; dos reglas de flujo nuevas (una PR por historia; corregir los avisos en su causa). Solo queda la demo de cierre.
- **v2.29 (29 sept. 2026)** — la demo de cierre pasa a "En curso", con su guion y la lista de la primera entrega a producción.
- **v2.30 (29 sept. 2026)** — la demo se aplaza al final del proyecto (los profesores solo revisan el proyecto terminado); la primera entrega a producción (v1.0.0) se hace ya, para encontrar ahora los problemas que solo aparecen en producción.
- **v2.31 (29 sept. 2026)** — v1.0.0 en producción; fallo de rutas detectado a los ~10 minutos y corregido en la v1.0.1, con un control nuevo (*smoke* de producción).
- **v2.32 (29 sept. 2026)** — limpieza: código en inglés (con excepciones anotadas), módulos vacíos o duplicados fuera, E2E solo en PRs a `main` hasta final de octubre.
- **v2.33 (29 sept. 2026)** — plan del Ciclo 2 en "Listo": UX-04, RF-41, RF-40a, RF-40b, RF-30, y la demo al final. Primera entrega a producción, hecha.
- **v2.34 (29 sept. 2026)** — UX-04 hecha; RF-41 en curso.
- **v2.35 (2 oct. 2026)** — RF-41 hecha; RF-40a en curso (construida contra el *Fake*).
- **v2.36 (3 oct. 2026)** — nuevas en "Listo", detrás de RF-40a: UX-05, RF-42 y RF-43 (confirmadas por el autor). La idea de "situaciones a evitar" pasa a ser RF-42.
- **v2.37 (3 oct. 2026)** — RF-40a e imports `#` hechos; UX-05 en curso.
- **v2.36 (3 oct. 2026)** — el *keep-alive* de Supabase se ejecuta cada 5 días (antes, a diario).
- **v2.38 (3 oct. 2026)** — UX-05 rediseñada tras probarla (guardar por categoría, ventana solo con idea nueva, historial a Resultados); UX-06 añadida detrás.
- **v2.39 (3 oct. 2026)** — UX-05 crece (decisión del autor): carrusel de ideas, ideas que cambian con "¿Qué te ayuda?" (RF-40 v1.1) y el panel de progreso, adelantado de UX-06.
- **v2.40 (4 oct. 2026)** — UX-05 hecha; UX-06 en curso (categorías en acordeón y menú `Drawer`); PERF-01 y UX-07 añadidas a "Listo" (confirmadas por el autor).
- **v2.41 (4 oct. 2026)** — PERF-01 en curso y hecha en la rama (junto con UX-06; irán en la misma PR que el renombrado y UX-07, decisión del autor).
- **v2.42 (4 oct. 2026)** — UX-07 hecha en la rama (con UX-06 y PERF-01, para la misma PR que el renombrado).
