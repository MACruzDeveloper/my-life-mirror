# Métricas que importan: DORA y Flujo (Flow) — plan de revisión de calidad

**Estado:** Planificado — **no instrumentado todavía**. Este documento fija *qué* se medirá, *de dónde* saldrá cada dato y *cuándo* se revisa, para no improvisarlo al final.
**Fecha:** 19 de septiembre de 2026
**Relacionado con:** [00_Metodologia_Lean.md](00_Metodologia_Lean.md), [01_Backlog_MVP.md](01_Backlog_MVP.md), [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md), [CHANGELOG](../../CHANGELOG.md)

---

## 1. Para qué sirven y para qué no

Lean pide "mejora continua", y mejorar sin medir es opinar. Se eligen dos familias porque miden cosas distintas y se complementan:

| Familia | Pregunta | Mira |
|---|---|---|
| **DORA** | ¿Cuánto de rápido y de seguro llega un cambio a producción? | El *sistema de entrega* (repositorio, despliegue). |
| **Flujo (Flow)** | ¿Cuánto de bien fluye el trabajo desde que se decide hasta que está hecho? | El *sistema de trabajo* (el tablero de [01_Backlog_MVP.md](01_Backlog_MVP.md)). |

**Advertencias deliberadas (léelas antes de mirar un número):**
- Es un proyecto de **una persona** con pocas entregas: las bandas de rendimiento de DORA ("élite", "alto"…) no son comparables y **no se usan como objetivo**. Sirven para ver la *tendencia* y detectar cuellos de botella, no para sacar nota.
- Una métrica que se convierte en objetivo deja de ser útil (ley de Goodhart). Aquí son **instrumentos para aprender**, y material citable para la memoria del TFM, nunca un criterio para dar una tarea por buena — eso lo siguen decidiendo los tests, el lint, el build y la validación con usuarios.
- No se añade herramienta ni proceso nuevo para medir: los datos ya existen en git, en Vercel y en el tablero. Medir no puede costar más trabajo del que ahorra (mismo criterio de desperdicio de Lean).

## 2. DORA

Las cuatro clásicas más la quinta añadida por DORA en 2024:

| Métrica | Qué mide | Cómo se obtiene aquí | Salvedad en este proyecto |
|---|---|---|---|
| **Frecuencia de despliegue** | Cuántas veces se despliega a producción por unidad de tiempo. | Nº de despliegues de producción en Vercel (o de merges a `main`) por semana. | Producción = `main`, sin despliegues hasta completar el MVP: se simula por PR a `develop` (§6). |
| **Plazo de entrega de cambios** (*lead time for changes*) | Tiempo desde el primer commit de un cambio hasta que está desplegado. | Fecha del primer commit de la rama vs. fecha del merge/despliegue (`git log`, historial de PR, Vercel). | Ramas grandes (varias tareas juntas, como las PRs de RF-03/RF-06) inflan el número: conviene mirarlo *por tarea*, no por PR. |
| **Tasa de fallo de cambios** | % de despliegues que provocan un fallo y exigen arreglo urgente o retroceso. | Despliegues seguidos de un fix urgente ÷ despliegues totales. Pistas: entradas "Corregido" del CHANGELOG, commits `fix`. | Con pocos despliegues, un solo fallo mueve mucho el porcentaje — leer siempre con el recuento absoluto al lado. |
| **Tiempo de recuperación** (*failed deployment recovery time*) | Cuánto se tarda en volver a un estado sano tras un despliegue fallido. | Desde que se detecta el fallo hasta que el arreglo está desplegado. | Casos reales ya vividos (p. ej. sesión que devolvía 500 con la tabla sin migrar) se cuentan como ejemplos cualitativos. |
| **Tasa de retrabajo** (*rework rate*, 2024) | % de despliegues *no planificados* para corregir un defecto de otro reciente. | Despliegues de tipo "corrección" ÷ despliegues totales, según el CHANGELOG. | Distinguirla de la anterior: aquí importa cuánto trabajo se rehace, no si hubo caída. |

**Señal cualitativa ya observada (sin cifras todavía):** los fallos reales encontrados hasta ahora (alias de importación que fallaban solo en las funciones de `api/`, estado en memoria que no sobrevivía entre funciones serverless, cabecera que no se refrescaba) se detectaron **con pruebas manuales, no con Vitest** — es lo que motivó [Playwright](../requirements-analysis/04_Plan_Verificacion_Validacion.md) y sería una de las lecturas más interesantes de la tasa de fallo cuando haya datos.

## 3. Flujo (Flow Framework)

| Métrica | Qué mide | Cómo se obtiene aquí |
|---|---|---|
| **Flow load** (carga de trabajo) | Elementos en curso a la vez. | Ya está acotada por diseño: **límite WIP = 2** en el tablero. La métrica es cuántas veces se rompió o estuvo cerca de romperse. |
| **Flow time** (tiempo de flujo) | Tiempo desde que se empieza una tarea hasta que está hecha (de principio a fin). | Fecha de inicio (primer commit / paso a "En curso") → fecha de "Hecho" (merge). Por tarea (RF-XX). |
| **Flow velocity** (velocidad de flujo) | Nº de elementos terminados por unidad de tiempo. | Tareas movidas a "Hecho" por semana, contadas en el tablero. **Sin puntos de historia** (no se estima). |
| **Flow efficiency** (eficiencia de flujo) | % del flow time en que se trabaja de verdad frente a esperar. | Tiempo activo ÷ flow time. En un proyecto de una persona las esperas son sobre todo: decisiones pendientes, configuración externa (Supabase, Vercel), bloqueos por dependencias. Se estima, no se cronometra. |
| **Flow distribution** (distribución de flujo) | Reparto del trabajo entre tipos: funcionalidades, defectos, riesgos, deuda. | Clasificar cada elemento terminado; las secciones del CHANGELOG ya lo dan casi hecho: *Añadido* → funcionalidad, *Corregido* → defecto, *Cambiado* → deuda/estructura. |

**Lo que más se espera aprender:** si el reparto entre funcionalidad, defectos y reestructuración se está desviando hacia lo segundo y tercero (en las últimas semanas hubo bastante reorganización — `api/`, `shared/ui/`, metodología) y cuánto de eso desbloqueó de verdad tareas de "Listo", que es la regla de entrada del trabajo transversal en el tablero.

## 4. Cuándo se revisa y qué se recoge

- **Punto de revisión:** al cerrar las tareas de funcionalidad de "Listo" (hasta RF-14), **antes** de la fase de validación (usability test, demo). Ahí hay suficientes tareas terminadas y suficientes despliegues como para que las cifras sean algo más que anécdotas, y todavía queda margen para actuar sobre lo que se vea.
- **Qué se recoge desde ya, sin coste:** cada tarea se mueve en el tablero con su **fecha de inicio y de fin** (una anotación al lado del elemento). Todo lo demás se reconstruye a posteriori de git, Vercel y el CHANGELOG.
- **Salida esperada:** una sección "Resultados de la revisión" (a añadir aquí) con las cifras, una lectura honesta de qué dicen y qué **no** dicen (tamaño de muestra), y **uno o dos ajustes concretos** a las "Reglas de flujo" del tablero. Si una métrica no lleva a ninguna decisión, se descarta en la siguiente revisión.

## 5. Decisiones tomadas antes de medir

1. **¿Qué es "producción"?** `main` **es** producción, y no se despliega nada a `main` hasta completar el MVP (correcto: es lo que se decidió). Hasta entonces DORA *real* no es aplicable: habría una sola "entrega" al final. Para poder validar el proceso mientras tanto se **simula**, ver §6.
2. **Granularidad del cambio:** el elemento medido es **cada PR fusionada a `develop`** (*DORA-proxy*). Las PRs agrupan varias tareas, así que además se anota por tarea (RF-XX) en el tablero para el flow time.
3. **Dónde vive la fecha de inicio/fin:** en el propio tablero ([01_Backlog_MVP.md](01_Backlog_MVP.md)), para no crear otro documento que mantener.

## 6. Simulación DORA por PR (proxy)

Regla: **una PR fusionada a `develop` cuenta como un "despliegue simulado"** (Vercel además genera su *preview*, que sirve de prueba de que compila y arranca).

| Métrica DORA | Equivalente simulado |
|---|---|
| Frecuencia de despliegue | PRs fusionadas a `develop` por semana. |
| Plazo de entrega | Inicio real del trabajo (anotado en el tablero) → fusión de la PR. El primer commit **no** sirve si se comitea todo al final. |
| Tasa de fallo de cambios | PRs tras las que hizo falta un arreglo urgente ÷ PRs totales. |
| Tiempo de recuperación | Detección del fallo → arreglo fusionado. |
| Tasa de retrabajo | PRs cuyo contenido principal es "Corregido" en el CHANGELOG ÷ PRs totales. |

**Línea base reconstruida de git (PRs ya fusionadas):**

| PR | Fusionada | Trabajo (aprox.) | Lectura |
|---|---|---|---|
| #1 | 12 sept. 19:13 | estructura inicial | — |
| #2 | 12 sept. 19:30 | ajuste posterior, misma tarde | plazo muy corto |
| #3 | 14 sept. 09:55 | login/registro/i18n | un solo commit (09:54) tras días sin comitear: el plazo por fecha de commit subestima el real |
| #4 | 19 sept. 16:43 | perfil, categorías, consentimiento, Lean, E2E | trabajo del 14 al 19 sept.; PR grande (varias tareas) |

Frecuencia: 4 PRs en ~7 días. Fallos posteriores conocidos: el bloqueo de Vercel por email de autor y el 500 por tabla sin migrar se detectaron durante la PR/uso, no tras una fusión, así que **no cuentan como fallo de cambio**, pero sí se anotan como cualitativos.

**Hallazgo del ejercicio:** comitear una sola vez al final falsea el plazo de entrega y agranda la PR. Regla derivada: commits pequeños por tarea (o al menos anotar la fecha de inicio en el tablero) y PRs por tarea o pequeño grupo de tareas.

**Aplicar a cada PR desde ahora:** al fusionar, añadir una fila a la tabla con fecha de inicio, fecha de fusión, tipo (funcionalidad/corrección/estructura) y si generó un arreglo urgente.

---

## Historial de cambios

- **v1.0 (19 sept. 2026)** — versión inicial: DORA (cinco métricas) y Flow (cinco métricas) mapeadas a las fuentes de datos reales del proyecto, con punto de revisión previo a la validación. Solo planificación: aún no se mide nada.
- **v1.1 (19 sept. 2026)** — decisiones abiertas resueltas (producción = `main` al completar el MVP; DORA-proxy por PR a `develop`), simulación con línea base reconstruida de git y hallazgo sobre commits grandes.
