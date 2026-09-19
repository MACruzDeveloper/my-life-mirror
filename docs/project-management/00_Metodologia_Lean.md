# Metodología de trabajo: Lean + Kanban con apetito fijo

**Estado:** Aceptada
**Fecha:** 19 de septiembre de 2026
**Relacionado con:** [01_Backlog_MVP.md](01_Backlog_MVP.md), [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md), [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)

---

## 1. Qué se decide y qué no cambia

Se distinguen dos capas que a menudo se confunden:

| Capa | Pregunta | Decisión |
|---|---|---|
| **Modelo de ciclo de vida** | ¿*Qué* riesgo se ataca en cada ciclo? | **Espiral ligero dirigido por riesgo** — sin cambios ([01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md)). |
| **Gestión del trabajo** | ¿*Cómo* fluye el trabajo día a día? | **Lean + Kanban con apetito fijo** — sustituye a los sprints semanales. |

El proyecto nunca aplicó Scrum: no hay roles, ceremonias, estimación ni velocidad. Los "Sprint 0-6" del backlog original eran un calendario semanal para una sola persona, y eso es lo que se retira.

## 2. Por qué Lean (y no Shape Up ni dual-track)

Alternativas vistas en clase, evaluadas contra este proyecto (una persona, plazo fijo el 31-oct-2026, tecnología poco conocida a propósito, requisitos que cambian al descubrir cosas):

| Opción | Encaje | Motivo |
|---|---|---|
| **Lean** ✅ | Alto | Eliminar desperdicio, decidir lo más tarde posible, aprender rápido y mejorar de forma continua. Es lo que ya ha ocurrido de hecho: el plan cambió al descubrir cosas (persistencia en memoria vs. Supabase, Header reactivo, categorías con consentimiento) y un calendario de sprints fijo lo habría penalizado. |
| **Shape Up** | Parcial | Aporta una idea muy útil (**apetito**: tiempo fijo, alcance variable) que se adopta. El método completo asume ciclos de 6 semanas, "shapers" y "builders" separados y una mesa de apuestas — no hay equipo, y queda aproximadamente un ciclo. |
| **Dual-track agile** | Bajo | Pensado para tener una vía de descubrimiento paralela a la de entrega, con personas distintas. Aquí una sola persona hace ambas cosas, y el descubrimiento real (usability test, pareja como tester) ya es pequeño y explícito en el plan de V&V. |

## 3. Cómo se aplica

**Principios Lean → prácticas concretas**

| Principio Lean | Práctica en este proyecto |
|---|---|
| Eliminar desperdicio | Nada se construye "por si acaso": una tarea entra al tablero solo si desbloquea algo de "Listo" o cumple un requisito Must. La deuda y las ideas viven en "Decisiones y deuda" sin coste hasta que duelen. YAGNI ya está en [02_Principios_Diseño.md](../architecture-decisions/02_Principios_Diseño.md). |
| Amplificar el aprendizaje | Cada hallazgo real (bug, límite de una herramienta) se documenta como lección (p. ej. [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md) §1bis) y cambia una regla de flujo, no solo el código. |
| Decidir lo más tarde posible | Decisiones caras de revertir (persistencia real, roles, Playwright contra `api/`) se aplazan hasta que un caso concreto las exige, y entonces se toman con evidencia. |
| Entregar lo antes posible | Cortes verticales finos (dominio → aplicación → infraestructura → vista → prueba) que funcionan de extremo a extremo antes de pasar a la siguiente tarea. |
| Integridad incorporada | TDD obligatorio ([AGENTS.md](../../AGENTS.md)), especificaciones Nivel 2 ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)), tests, lint y build en verde antes de dar algo por hecho. |
| Mejora continua | Al cerrar una tarea se revisa lo aprendido y se ajustan las "Reglas de flujo" del tablero. La revisión con datos (DORA y métricas de Flujo) está planificada en [02_Metricas_DORA_y_Flujo.md](02_Metricas_DORA_y_Flujo.md). |

**Kanban (la mecánica)**

- Tablero de tres estados: *Listo → En curso → Hecho*, ordenado por **riesgo y dependencias** (criterio del espiral), no por numeración de RF.
- **Límite WIP de 2**: una sola persona; más de dos cosas abiertas a la vez es señal de bloqueo, no de productividad.
- **Pull**: se toma la siguiente tarea de arriba de "Listo" cuando hay hueco, no cuando toca el calendario.

**Apetito fijo (de Shape Up)**

- El **tiempo es fijo** (31 oct.); el **alcance es lo que se ajusta**. Sustituye al "Sprint 6 de colchón".
- Una **línea de corte** en "Listo" separa lo que se hará seguro de lo que se sacrifica si el tiempo no llega. Se revisa al cerrar cada tarea. Nunca se estira el plazo.
- **Lo último en recortarse es la validación** (usability test, corrección, demo): es lo que convierte el TFM en evidencia, no solo en código.

## 4. Riesgos asumidos

- **Sin cadencia externa** el flujo continuo puede diluir el ritmo. Mitigación: la línea de corte y la revisión al cerrar cada tarea actúan como cadencia propia.
- **Sin estimaciones** no hay predicción formal. Se compensa con la capacidad de referencia (10-12 h/semana) para decidir la línea de corte, y con tareas pequeñas y finas (rara vez más de un par de sesiones).
- **Evidencia para la memoria:** el historial de cambios, el CHANGELOG y las lecciones documentadas sustituyen a las métricas de velocidad como trazabilidad del proceso.

---

## Historial de cambios

- **v1.1 (19 sept. 2026)** — enlace al plan de métricas DORA y Flow.
- **v1.0 (19 sept. 2026)** — versión inicial: Lean + Kanban con apetito fijo, sustituyendo los sprints semanales del backlog original. El espiral se mantiene como modelo de ciclo de vida.
