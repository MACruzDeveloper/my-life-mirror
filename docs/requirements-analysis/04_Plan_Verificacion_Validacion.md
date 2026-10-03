# Plan de Verificación y Validación (V&V) — Fase 2

**Basado en:** [01_Requisitos_Fase1.md](01_Requisitos_Fase1.md) v0.3
**Fecha:** 5 de septiembre de 2026
**Alcance:** técnicas realistas para un TFM desarrollado por una persona, con fecha límite el 31 de octubre de 2026 (RES-01, RES-02). No se pretende cobertura exhaustiva tipo producto real, sino un conjunto mínimo defendible que genere evidencia real para la memoria.

---

## 0. Verificación vs. Validación

| | Pregunta que responde | En este proyecto |
|---|---|---|
| **Verificación** | ¿Estamos construyendo el sistema correctamente (conforme a lo especificado)? | ¿La lógica de puntuación/umbral hace lo que dice RF-18? ¿El check-in tarda <2 min (RNF-01)? |
| **Validación** | ¿Estamos construyendo el sistema correcto (el que el usuario realmente necesita)? | ¿El tono se percibe motivador y no punitivo (RN-04)? ¿La gente vuelve a usarlo? |

Ambas son necesarias: se puede verificar perfectamente un sistema que resuelve el problema equivocado, o construir "lo correcto" con una implementación defectuosa.

---

## 1. Técnicas de Verificación seleccionadas

| Técnica | Cómo se aplica aquí | Requisitos objetivo | Prioridad |
|---|---|---|---|
| **Revisión formal / peer review** | ⏸️ En espera: de momento no hay acceso a tutor ni compañeros de máster para revisar documentos o demos. Esta misma conversación actúa como primera revisión mientras tanto. Retomar en cuanto haya una interacción disponible con el tutor (ver también el punto pendiente de RES-09). | Todos (calidad del propio documento) | Alta — pendiente de disponibilidad |
| **Pruebas unitarias** | Con Vitest (ya compatible con el stack Vite/TS/React del repo) sobre la lógica de negocio pura: cálculo de puntuación global (RF-17), disparo de recomendación por umbral (RF-18), lógica de aceptación/descarte (RF-19/RF-20). | RF-17, RF-18, RF-19, RF-20, RES-09 | Alta |
| **Pruebas de integración** | React Testing Library sobre flujos completos de componente: completar un check-in de principio a fin, activar/desactivar una categoría sensible y comprobar que pide consentimiento (RF-04). | RF-04, RF-10, RF-14 | Media |
| **UAT dirigido por criterios (Given/When/Then)** | Por cada RF de prioridad Must/Should, redactar 1 criterio de aceptación en formato Given/When/Then (ver plantilla y ejemplos apartado 3) y ejecutarlo manualmente como checklist antes de cada demo. | RF Must/Should | Alta |
| **Criterios de aceptación ejecutables** | Automatizar con Playwright los escenarios Given/When/Then de **todos los RF de prioridad Must**, etiquetados por ID de RF para trazabilidad directa requisito↔prueba. Should/Could quedan como checklist manual salvo que sobre tiempo. Instalado el 15 sept. (`e2e/`, `npm run test:e2e`); primer test cubre solo páginas públicas — los flujos que tocan `api/` (RF-01 registro/login, el Must más obvio) están pendientes de decidir aislamiento de datos de prueba antes de automatizarse. | RF Must | Alta |

### 1.1 Límite real encontrado: lo que Vitest no puede ver (14 sept. 2026)

Caso concreto, no hipotético: `ProfileRepository` en memoria pasó 100% de sus tests unitarios y de aplicación (Vitest) desde el primer momento, y seguía pasándolos incluso después de descubrirse que estaba roto de verdad. La razón es estructural, no un test mal escrito: **Vitest ejecuta todo dentro de un único proceso Node**, así que un `Map` en memoria compartido entre "casos de uso" en un test *sí* se comparte — exactamente la condición que **no** se cumple en producción/`vercel dev`, donde cada archivo de `api/` es una función serverless aislada sin memoria compartida con las demás. El bug (nombre guardado desde `api/accounts/profile.ts` invisible para `api/accounts/session.ts`) solo era detectable ejecutando la app de verdad contra funciones serverless reales — ninguna cantidad de tests unitarios/de integración corriendo en un solo proceso podía haberlo revelado.

**Lección para el resto del proyecto**: la "Prueba unitaria" de esta tabla verifica lógica de negocio correctamente, pero no verifica *dónde vive el estado entre peticiones* — eso es un problema de arquitectura de despliegue, no de lógica, y necesita su propia categoría de comprobación: probar manualmente (o con Playwright) contra `vercel dev` real antes de dar por cerrado cualquier RF cuyo dato se escriba en un endpoint y se lea en otro. Ver [04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md) apartado 5.1 para la corrección aplicada (persistencia real en Supabase adelantada respecto al plan original).

### 1.2 E2E con `api/` contra un Supabase local (27 sept. 2026)

Decisión que apartado 1.1 dejaba pendiente: **cómo automatizar los flujos que escriben datos sin tocar la base real.**

- **Base de datos:** Supabase local en Docker (`supabase start`, configuración en `supabase/config.toml`). Cada ejecución la vacía y reaplica `supabase/migrations` (`supabase db reset`), así que además comprueba que las migraciones funcionan sobre una base limpia. Se descartaron un segundo proyecto de Supabase en la nube (más credenciales que gestionar y otra base que se pausa) y usar la base real borrando después (si la limpieza falla, quedan cuentas de prueba entre las reales).
- **Servidor:** no `vercel dev`. Se comprobó, con una sonda que no escribe nada, que `vercel dev` carga siempre el `.env` del proyecto aunque se le pasen otras variables: un test de registro habría creado cuentas en la base real. En su lugar, un plugin de Vite (`e2e/support/apiDevServer.ts`) sirve las funciones de `api/` con las mismas rutas que Vercel (probadas con Vitest) y **se niega a arrancar si `SUPABASE_URL` no es local**.
- **El fallo de apartado 1.1 sigue cubierto:** cada petición carga los módulos en un *module runner* nuevo, así que ninguna función ve la memoria de otra. Comprobado a propósito con dos funciones temporales (una guarda en un `Map`, la otra no lo ve).
- **Tests:** Page Objects en `e2e/api/pages/`, un usuario nuevo por test (corren en paralelo), en móvil (Pixel 7) y escritorio. Primera batería: RF-01 (registro con sesión, login, contraseña incorrecta, cerrar sesión y volver), RF-39/UX-01 (bienvenida con "Cómo funciona"), RF-10 + RF-14 + RF-15 + RF-18 + UX-02 (puntuar, panel, equilibrio, idea para el área baja con el aviso de RES-05), RF-04 (aceptar y cancelar el consentimiento, persistido) y RF-05 (exportación con los datos; borrado con contraseña correcta e incorrecta).
- **Cuándo se ejecuta:**
  - **En cada PR, solo:** workflow de GitHub Actions `E2E con api` (`.github/workflows/e2e-api.yml`). La máquina de GitHub trae Docker, levanta su propio Supabase vacío y ejecuta la misma batería; no necesita secretos porque nunca toca la base real. Si falla, el PR lo muestra y el informe queda como artefacto descargable (`informe-playwright`).
  - **En local, cuando se quiera:** `npm run test:e2e:api` (~35 s con el reinicio de la base). No va en el *pre-push*: necesita Docker abierto.

- **Lección de la primera ejecución en CI (28 sept.):** un test falló solo en móvil y solo en la máquina de GitHub, más lenta. El Page Object elegía entre el menú móvil y el botón de escritorio con `isVisible()`, que mira una vez sin esperar; justo después del registro la cabecera aún no estaba pintada. Ahora se decide por el ancho de pantalla (el mismo punto de corte que la cabecera) y se deja que Playwright espere. Regla para los Page Objects: nunca bifurcar con `isVisible()`; decidir con datos fijos (dispositivo, estado conocido) y dejar esperar a las acciones. En esa misma ejecución Docker Hub/ECR respondió varias veces `toomanyrequests` al descargar imágenes; la CLI de Supabase reintentó y siguió, pero es un riesgo conocido de la primera descarga en cada ejecución.

- **Segunda lección (3 oct.):** fallos intermitentes (1 de cada 4-5) que no venían del código: tras vaciar la base (`db reset`), la API de Supabase tarda un instante en volver a leer qué tablas hay, y si los tests empiezan en ese momento sus primeras peticiones fallan. La solución no fue reintentar los tests, sino esperar a que la base esté lista de verdad (`waitForSchema` en `scripts/local-supabase.mjs`). Regla: un test intermitente se investiga hasta encontrar la causa; reintentar solo la esconde.

#### 1.2.1 Cómo ver que funciona

Requisito: Docker Desktop abierto. La primera vez, `supabase start` descarga las imágenes (unos minutos).

| Qué | Comando | Qué se ve |
|---|---|---|
| Ejecución normal | `npm run test:e2e:api` | La lista de tests con ✓/✘ en la terminal. |
| En directo | `npm run test:e2e:api -- --headed` | Los navegadores (móvil y escritorio) se abren y la app se usa sola, paso a paso. |
| Modo interactivo | `npm run test:e2e:api -- --ui` | La ventana de Playwright: se elige un test, se ejecuta y se recorre cada acción hacia atrás con su captura ("viaje en el tiempo"). La mejor opción para la demo. Mientras está abierta ocupa el puerto 5174. |
| Informe | `npm run test:e2e:api -- --reporter=html` y después `npx playwright show-report` | Una página con cada test, su resultado y su duración (y la traza si alguno falla). Útil como captura para la memoria. |
| Solo un test | `npm run test:e2e:api -- -g "consent"` | Ejecuta solo los tests cuyo nombre contiene el texto. |
| Solo un dispositivo | `npm run test:e2e:api -- --project=mobile` | `mobile` (Pixel 7) o `desktop`. |
| Los datos que crean | Supabase Studio local: http://127.0.0.1:54323 | *Authentication → Users* (cuentas `e2e-…@example.com`), *Table Editor* (`assessments`, `recommendations`…). La siguiente ejecución los borra. |
| En GitHub | Pestaña *Actions* → `E2E con api`, o el apartado de *checks* del PR | El resultado en cada PR; el informe HTML se descarga desde el artefacto `informe-playwright`. |

Otros comandos útiles:

- `npm run dev:local` — la app completa contra el mismo Supabase local (http://localhost:5175), para probarla a mano sin cuentas de Vercel ni de Supabase. Los datos se conservan entre arranques; `npx supabase db reset` la vacía.
- `npx supabase stop` — apaga el Supabase local y libera la memoria (sus contenedores siguen consumiendo aunque no se use). Los dos comandos anteriores lo vuelven a arrancar si hace falta.

---

## 2. Técnicas de Validación seleccionadas

| Técnica | Cómo se aplica aquí | Requisitos objetivo | Prioridad |
|---|---|---|---|
| **Demos frecuentes** | Una demo al tutor (y a 2-3 personas no técnicas) al cierre de cada ciclo del modelo de ciclo de vida (ver archivo 03) — mínimo al cerrar el MVP. | RN-01 a RN-04 en conjunto | Alta |
| **Usability testing** | Ajustado a la disponibilidad real: de momento solo hay una persona disponible para dar opinión de usuario (mi pareja). Se ejecuta con n=1 sobre las pantallas críticas (onboarding, check-in, recomendación), documentando explícitamente esta limitación de muestra frente a la regla de Nielsen (5 personas). Si en el futuro hay acceso a más personas (compañeros, tutor), se amplía la muestra. | RN-04, RES-07 | Alta — es el requisito de mayor riesgo del proyecto |
| **Pilot testing** | Mismo ajuste: piloto corto con la(s) persona(s) realmente disponibles en lugar de las 5-10 asumidas inicialmente. Sigue generando evidencia real, aunque cualitativa más que estadística. | RN-01, RN-02, RN-03 | Alta — genera evidencia citable en la memoria |
| **Métricas de negocio (simuladas)** | Del propio piloto: tasa de finalización del check-in vs. objetivo RNF-01 (<2 min), tasa de aceptación/descarte de recomendaciones (RF-19), tasa de retorno semanal. | RNF-01, RF-19 | Media |
| **A/B testing** | **No se ejecuta** con significancia estadística real (la muestra del piloto es demasiado pequeña). Se documenta como diseño de experimento metodológico (hipótesis + variantes + métrica) a modo de "trabajo futuro", demostrando conocimiento de la técnica sin fingir resultados no válidos. | RN-02 (redacción de recomendaciones) | Baja (documental) |

---

## 3. Plantilla y ejemplos de criterios de aceptación (Given/When/Then)

Formato a replicar para cada RF Must/Should en la fase de "casos de uso / historias de usuario" (paso 5 de `01_Requisitos_Fase1.md`):

```
RF-XX — <resumen>
  Given <estado inicial>
  When <acción del usuario>
  Then <resultado esperado y verificable>
```

**Ejemplos ya redactados, para las tres áreas de mayor riesgo:**

> **RF-04** (consentimiento en categorías sensibles)
> Given un usuario que activa por primera vez la categoría "sexo"
> When confirma la activación
> Then el sistema debe solicitar y registrar un consentimiento explícito y diferenciado (RD-05) antes de permitir el primer check-in en esa categoría.

> **RF-18** (recomendación por umbral)
> Given una categoría activa con puntuación por debajo del umbral configurado
> When el usuario completa el check-in de esa categoría
> Then el sistema debe mostrar al menos una recomendación concreta asociada a esa categoría.

> **RES-09 / RF-29** (no diagnóstico, solo umbral de comportamiento)
> Given un usuario con puntuaciones bajas sostenidas y recomendaciones descartadas repetidamente en una categoría
> When se supera el umbral configurado de descartes
> Then el sistema debe sugerir un recurso de apoyo profesional con lenguaje no directivo y el disclaimer de RES-05, **sin** emitir ninguna afirmación sobre el estado clínico del usuario.

---

## 4. Resumen — qué se hace de verdad vs. qué se documenta como futuro

Dado el alcance real (RES-01, RES-02):

- **Se ejecuta de verdad:** peer review del documento, pruebas unitarias sobre lógica de negocio, checklist Given/When/Then manual, un usability test con n = 1 (ver apartado 2; [guion](../validation/01_Guion_Test_Usabilidad.md) y [resultados](../validation/02_Resultados_Test_Usabilidad.md)), un piloto corto con métricas básicas, y Playwright para lo que no toca `api/` (páginas públicas, ver `e2e/`, instalado 15 sept.).
- **Se documenta como diseño/trabajo futuro, sin ejecutar a escala real:** Playwright contra flujos que sí tocan `api/` (registro, login...) — pendiente decidir cómo aislar los datos de prueba (¿proyecto de Supabase dedicado? ¿limpieza tras cada test?) antes de automatizar nada que cree cuentas reales; A/B testing con significancia estadística.

Esto es coherente con lo que ya aceptamos en RES-10 para el contenido de otras funcionalidades: priorizar la demostración rigurosa del concepto y del método sobre la cobertura exhaustiva, dado el marco temporal del TFM.

---
## Historial de cambios

- **v1.0 (5 sept. 2026)** — versión inicial: técnicas de verificación (peer review, tests unitarios/integración, UAT Given/When/Then, criterios ejecutables opcionales) y validación (demos, usability testing 5 personas, piloto 5-10 personas, métricas, A/B documental).
- **v1.1 (6 sept. 2026)** — ajustes tras revisión:
  - Peer review marcado en espera (sin acceso a tutor/compañeros por ahora).
  - Usability testing y pilot testing ajustados a la disponibilidad real (n=1, mi pareja), documentando la limitación frente a la muestra ideal.
  - Automatización con Playwright de los criterios de aceptación pasa de "opcional" a prioridad Alta, específicamente para todos los RF de prioridad Must.
- **v1.1 (14 sept. 2026)** — apartado 1.1: caso real de un límite estructural de Vitest (no detecta que los datos no sobreviven entre funciones serverless distintas) encontrado al implementar RF-03.
- **v1.2 (15 sept. 2026)** — Playwright instalado de verdad (apartado 1, apartado 4): primer test cubre solo páginas públicas. Automatizar RF-01 (registro/login) — el caso que motivó apartado 1.1 — queda pendiente de decidir aislamiento de datos de prueba en Supabase.
- **v1.3 (26 sept. 2026)** — apartado 4 corregido: decía "usability test de 5 personas", contradiciendo el ajuste a n = 1 de apartado 2. Enlaces al guion y a la hoja de resultados del test del MVP.
- **v1.4 (27 sept. 2026)** — nueva apartado 1.2: E2E con `api/` contra Supabase local en Docker, con un servidor propio en Vite (no `vercel dev`, que carga siempre la base real) y aislamiento entre funciones que mantiene cubierto el fallo de apartado 1.1. Primera batería de 9 tests × 2 dispositivos.
- **v1.5 (28 sept. 2026)** — apartado 1.2: workflow de GitHub Actions en cada PR y nuevo apartado 1.2.1 "Cómo ver que funciona" (modos `--headed`, `--ui`, informe HTML, Studio local, `npm run dev:local`). Los apartados "1bis/1ter" pasan a numeración decimal (1.1, 1.2), igual que en el resto de documentos.
- **v1.6 (29 sept. 2026)** — se elimina el apartado "Próximo paso": era una nota de la conversación de trabajo y lo pendiente vive en el [tablero](../project-management/01_Backlog_MVP.md).
- **v1.6 (3 oct. 2026)** — apartado 1.2: segunda lección de los E2E (carrera tras `db reset`, resuelta esperando a que la API vea las tablas).
