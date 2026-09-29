# Métricas que importan: DORA y Flujo (Flow) — plan de revisión de calidad

**Estado:** Primera revisión hecha (29 sept. 2026, apartado 7). Este documento fija *qué* se mide, *de dónde* sale cada dato y *cuándo* se revisa, y recoge los resultados.
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
| **Frecuencia de despliegue** | Cuántas veces se despliega a producción por unidad de tiempo. | Nº de despliegues de producción en Vercel (o de merges a `main`) por semana. | Producción = `main`, sin despliegues hasta completar el MVP: se simula por PR a `develop` (apartado 6). |
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

1. **¿Qué es "producción"?** `main` **es** producción, y no se despliega nada a `main` hasta completar el MVP (correcto: es lo que se decidió). Hasta entonces DORA *real* no es aplicable: habría una sola "entrega" al final. Para poder validar el proceso mientras tanto se **simula**, ver apartado 6.
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

## 7. Resultados de la primera revisión (29 sept. 2026)

**Cuándo:** al cerrar el MVP funcional y la validación, con 11 PRs fusionadas a `develop` (12-28 sept.). El plan (apartado 4) la situaba *antes* de la validación; se hizo después porque la validación se adelantó en el tablero. A cambio, los datos incluyen el ciclo completo: funcionalidad, validación con usuario y las correcciones que salieron de ella.

**Fuentes:** GitHub (PRs, commits y estados de Vercel y de GitHub Actions de cada commit), `git log`, los logs de Vercel, el historial de cambios de cada historia de usuario y el CHANGELOG. Horas en hora peninsular (UTC+2). No se ha usado ninguna herramienta nueva.

### 7.1 Datos por PR

| PR | Fusionada | Contenido principal | Tipo | Commits | 1.er commit → fusión | Fallos antes de fusionar | Fallo después |
|---|---|---|---|---|---|---|---|
| #1 | 12 sept. 19:13 | documentación inicial | estructura | 1 | 12 min | — | — |
| #2 | 12 sept. 19:30 | estructura inicial | estructura | 1 | 2 min | — | — |
| #3 | 14 sept. 09:55 | RF-01, RF-38, RF-39, i18n | funcionalidad | 1 | 1 min | — | — |
| #4 | 19 sept. 16:43 | RF-03, RF-04, RF-06/07, Lean, E2E | funcionalidad | 1 | 31 min | — | — |
| #5 | 19 sept. 19:08 | RF-10, ADM-01, ADM-02, límite de 12 funciones | funcionalidad | 4 | 28 min | 3 builds de Vercel en rojo (tipos, límite de funciones) | **sí** (probable): las funciones dejaron de arrancar en Vercel (apartado 7.2) |
| #6 | 20 sept. 19:35 | RF-05, RF-18, ADM-03, caché | funcionalidad | 1 | 10 min | — | — |
| #7 | 26 sept. 18:04 | RF-14, RF-16, reorganización del frontend | funcionalidad + estructura | 1 | 6 min | — | — |
| #8 | 26 sept. 18:20 | *keep-alive* de Supabase | infraestructura | 1 | 2 min | — | — |
| #9 | 27 sept. 09:19 | RF-15, inglés en categorías | funcionalidad | 2 | 14 h 05 min | 1 build de Vercel en rojo (un campo a medias) | — |
| #10 | 27 sept. 18:40 | validación, UX-01/02/03, Husky, región, **arreglo de apartado 7.2** | corrección + funcionalidad | 3 | 1 h 34 min | — | — |
| #11 | 28 sept. 20:23 | E2E con `api/` (Docker) y CI | calidad | 2 | 24 min | 1 E2E en rojo en CI (condición de carrera del test) | — |

### 7.2 El fallo que llegó a `develop`

- **Qué:** desde la PR #5 (probable), las funciones de `api/` no arrancaban en Vercel (`ERR_MODULE_NOT_FOUND`: imports relativos sin extensión en ESM nativo). El build salía en verde; el fallo solo aparecía al ejecutarse.
- **Por qué pasó (causa probable):** ese mismo día el build de Vercel avisó con TS2835 (*"Relative import paths need explicit file extensions"*), que era exactamente el problema. Se "arregló" cambiando la configuración de `api/` a una que acepta imports sin extensión: se **silenció el aviso en lugar de corregir la causa**. No se puede demostrar que las *previews* funcionasen antes (Vercel no conserva logs tan antiguos), por eso "probable".
- **Por qué nadie lo vio en 8 días:** todo se probaba en local (`vercel dev` y Vite resuelven los imports sin extensión) y nadie usó las *previews*. Producción (`main`) aún no existe, así que ningún usuario real se vio afectado.
- **Recuperación:** detectado el 27 sept. hacia las 18:22 (el autor intenta entrar en la *preview*); arreglo fusionado a las 18:40. **Unos 20 minutos desde la detección, unos 8 días desde que se introdujo.**
- **Qué cambió después:** `check:api` compila y **carga** cada función como Vercel (también en el *pre-push*), y los E2E con `api/` se ejecutan en cada PR. El mismo fallo hoy no pasaría de la PR.

### 7.3 DORA (simulado por PR, apartado 6)

| Métrica | Resultado | Lectura |
|---|---|---|
| Frecuencia de despliegue | 11 PRs en 16 días (≈ 4,8 por semana). Por semana: 2 · 4 · 4 · 1 (semana en curso). | Alta y estable para una persona a tiempo parcial. |
| Plazo de entrega (1.er commit → fusión) | Mediana **12 min**; máximo 14 h (#9, arreglo a la mañana siguiente). | **No es fiable:** se comitea casi todo al final (8 de 11 PRs con un solo commit), así que mide lo que se tarda en abrir y fusionar la PR, no el trabajo. El plazo real está en el *flow time* (apartado 7.4). |
| Tasa de fallo de cambios | **1 de 11 (9 %)**, el de apartado 7.2. | Con 11 PRs, un solo fallo pesa mucho; leer con el recuento al lado. Además: **5 fallos detectados antes de fusionar** (4 builds de Vercel y 1 E2E): de 6 fallos, los controles pararon 5; el que escapó era justo el que ningún control cubría. |
| Tiempo de recuperación | ~20 min tras detectarlo; ~8 días de exposición sin detectar. | La recuperación rápida no compensa la detección lenta: el problema era de **detección**, y es lo que se corrigió. |
| Tasa de retrabajo | Por PR: 1 de 11 con la corrección como contenido principal (#10). Por commit: **6 de 16 (38 %)** son arreglos (`fix…`) dentro de su propia PR. | Casi todo el retrabajo ocurre antes de fusionar y lo provoca el despliegue (configuración de Vercel), no la lógica de negocio. |

### 7.4 Flujo

Se mide por historia de usuario: inicio = fecha de su versión 1.0; fin = fusión de la PR que la contiene.

| Métrica | Resultado | Lectura |
|---|---|---|
| **Flow time** | 18 historias. 13 empezadas y terminadas **el mismo día**; 2 en 1 día (RF-01, RF-15); 3 en 4-5 días (RF-03, RF-04, RF-06/07). Mediana: 0 días. | Las de 4-5 días no llevaron más trabajo: **esperaron a salir juntas** en la PR #4 (un solo commit el 19 sept.). Salvedad: varias historias se escribieron junto con el código (RF-01 login lo dice explícitamente), así que la fecha de inicio subestima algunas. |
| **Flow velocity** | Historias terminadas por semana: 0 (12-13 sept., cimientos) · **12** (14-20 sept.) · **6** (21-27 sept.) + validación · 0 (28 sept.-, calidad). | Se frena al final porque cambia el tipo de trabajo (validación, calidad, despliegue), no porque se atasque. Por eso la distribución (abajo) importa más que la velocidad. |
| **Flow load (WIP)** | Límite WIP 2. Contenido por PR: 3 o más historias en #4, #5, #6 y #10. | **El límite se rompió a menudo**: se trabajaba en varias historias a la vez y se fusionaban juntas. Es la causa de los *flow times* de 4-5 días y del plazo de entrega poco fiable. |
| **Flow efficiency** | Días con actividad (commits o fusiones) ÷ días naturales: 7 de 17 (≈ 41 %). | Estimación gruesa. Las esperas son de calendario (dedicación parcial: del 21 al 25 sept. no hubo commits), no bloqueos técnicos ni decisiones pendientes: las decisiones se resolvían en la misma sesión. |
| **Flow distribution** | Entradas del CHANGELOG: **45 funcionalidad (51 %) · 18 corrección (20 %) · 26 cambio/estructura (29 %)**. | La funcionalidad sigue siendo la mitad. La estructura (29 %) es alta, pero casi toda desbloqueó algo de "Listo" (límite de 12 funciones, caché, i18n por id). Las correcciones se concentran en el despliegue y en lo que encontró la validación. |

### 7.5 Qué dicen y qué no dicen

- **Dicen:** el flujo es rápido y la lógica de negocio es sólida (cobertura 95-99 % en dominio y aplicación, sin fallos de lógica que llegaran a `develop`). El punto débil era la **frontera con la plataforma**: los 6 fallos (Vercel, ESM, CI) venían de ahí, ninguno de la lógica.
- **No dicen:** nada comparable con las bandas de DORA (una persona, 11 PRs, sin producción) ni con otro equipo. El plazo de entrega por commits está falseado por la costumbre de comitear al final.
- **El hallazgo principal:** los controles automáticos funcionan cuando existen (5 de 6 fallos parados antes de fusionar), y el único fallo que escapó lo hizo porque su tipo de error no tenía control. La respuesta correcta fue añadir el control (`check:api` con ejecución real, E2E en CI), no más cuidado manual.

### 7.6 Ajustes a las reglas de flujo

Dos, como pedía apartado 4 (añadidos a las "Reglas de flujo" del [tablero](01_Backlog_MVP.md)):

1. **Una PR por historia (como mucho dos, si dependen entre sí), con commits por paso.** Es la regla que ya salió el 19 sept. (apartado 6) y no se ha cumplido: 4 de 11 PRs llevan 3 historias o más. Sin ella, el plazo de entrega no se puede medir y el WIP real supera el límite.
2. **Un aviso del compilador o de la plataforma se corrige en su causa; no se silencia cambiando la configuración** sin entender qué detecta. Si hay que cambiar la configuración, se añade a la vez un control que cubra lo que el aviso vigilaba. Es la lección directa de apartado 7.2.

**Siguiente revisión:** al cerrar el Ciclo 1 (tras la demo), ya con la primera entrega real a `main`: ahí empieza la DORA de verdad (frecuencia y plazo hasta producción).

---

## Historial de cambios

- **v1.0 (19 sept. 2026)** — versión inicial: DORA (cinco métricas) y Flow (cinco métricas) mapeadas a las fuentes de datos reales del proyecto, con punto de revisión previo a la validación. Solo planificación: aún no se mide nada.
- **v1.1 (19 sept. 2026)** — decisiones abiertas resueltas (producción = `main` al completar el MVP; DORA-proxy por PR a `develop`), simulación con línea base reconstruida de git y hallazgo sobre commits grandes.
- **v1.2 (29 sept. 2026)** — primera revisión (apartado 7): datos de las 11 PRs, el único fallo que llegó a `develop` (funciones que no arrancaban en Vercel, 8 días sin detectar, 20 minutos en arreglarse), DORA simulado, métricas de flujo por historia y dos ajustes a las reglas de flujo.
