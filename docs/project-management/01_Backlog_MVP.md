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

- [ ] **RF-05** — Caso de uso `ExportarYEliminarDatos` (Must, derecho al olvido, RNF-12). No bloquea nada posterior, pero es requisito legal del producto: se hace antes de la línea de corte.
- [ ] **RF-10** — Value Object `Puntuacion` (rango 1-10 validado en construcción), Aggregate Root `Evaluación`; caso de uso `RegistrarEvaluacion` + sus tests de dominio. Es el núcleo del producto (check-in): desbloquea recomendaciones y panel.
- [ ] **RF-18** — Entidad `Recomendación`; `EvaluarUmbralYGenerarRecomendacion` (se dispara con el evento de `RegistrarEvaluacion`, ver Outbox en ADR-03 §3.4).
- [ ] **RF-14** — Caso de uso de solo lectura `ConsultarPanelGeneral`, componiendo Evaluaciones + Recomendaciones (sustituye el placeholder de `Home`).
- [ ] **Validación** — Usability test (n=1, ver [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md)) sobre el flujo completo, centrado en RN-04; corregir lo que salga; preparar la demo de cierre del Ciclo 1. Se reserva tiempo para esto **siempre**: es lo último que se recorta, no lo primero.

### ─── LÍNEA DE CORTE ─── (si el tiempo no llega, lo de abajo no se hace en el Ciclo 1)

- [ ] **RF-23** — Caso de uso `ConfigurarNotificaciones`. Ningún otro RF del Ciclo 1 depende de él.
- [ ] Primeras historias del Ciclo 2.

## Decisiones y deuda pendientes (no son tareas todavía; se convierten en una si duelen)

- **Playwright contra `api/`** (RF-01 registro/login): decidir cómo aislar los datos de prueba en Supabase (proyecto dedicado o limpieza tras cada test) antes de automatizar nada que cree cuentas reales. Ver [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md) §1bis.
- **Header con tres o más enlaces**: hoy hay uno ("Mi perfil"); si llega Evaluaciones, probablemente hace falta un menú (hamburguesa en móvil) en vez de más botones.
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
- [x] **Estructura:** `api/` por capacidad de negocio, `shared/ui/` por tipo, pantalla "Mi perfil" con pestañas (Perfil, Categorías), Playwright instalado (solo páginas públicas).

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
- **v2.0 (19 sept. 2026)** — se abandonan los sprints semanales por Lean/Kanban con línea de corte ([00_Metodologia_Lean.md](00_Metodologia_Lean.md)). Nunca hubo Scrum propiamente dicho (roles, ceremonias, velocidad): los "sprints" eran solo un calendario semanal para una persona. El espiral (ciclo de vida) se mantiene. El colchón del antiguo Sprint 6 pasa a ser la línea de corte + el hueco reservado de validación.
