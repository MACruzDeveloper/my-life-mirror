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
| **UAT dirigido por criterios (Given/When/Then)** | Por cada RF de prioridad Must/Should, redactar 1 criterio de aceptación en formato Given/When/Then (ver plantilla y ejemplos §3) y ejecutarlo manualmente como checklist antes de cada demo. | RF Must/Should | Alta |
| **Criterios de aceptación ejecutables** | Automatizar con Playwright los escenarios Given/When/Then de **todos los RF de prioridad Must**, etiquetados por ID de RF para trazabilidad directa requisito↔prueba. Should/Could quedan como checklist manual salvo que sobre tiempo. Instalado el 15 sept. (`e2e/`, `npm run test:e2e`); primer test cubre solo páginas públicas — los flujos que tocan `api/` (RF-01 registro/login, el Must más obvio) están pendientes de decidir aislamiento de datos de prueba antes de automatizarse. | RF Must | Alta |

### 1bis. Límite real encontrado: lo que Vitest no puede ver (14 sept. 2026)

Caso concreto, no hipotético: `ProfileRepository` en memoria pasó 100% de sus tests unitarios y de aplicación (Vitest) desde el primer momento, y seguía pasándolos incluso después de descubrirse que estaba roto de verdad. La razón es estructural, no un test mal escrito: **Vitest ejecuta todo dentro de un único proceso Node**, así que un `Map` en memoria compartido entre "casos de uso" en un test *sí* se comparte — exactamente la condición que **no** se cumple en producción/`vercel dev`, donde cada archivo de `api/` es una función serverless aislada sin memoria compartida con las demás. El bug (nombre guardado desde `api/accounts/profile.ts` invisible para `api/accounts/session.ts`) solo era detectable ejecutando la app de verdad contra funciones serverless reales — ninguna cantidad de tests unitarios/de integración corriendo en un solo proceso podía haberlo revelado.

**Lección para el resto del proyecto**: la "Prueba unitaria" de esta tabla verifica lógica de negocio correctamente, pero no verifica *dónde vive el estado entre peticiones* — eso es un problema de arquitectura de despliegue, no de lógica, y necesita su propia categoría de comprobación: probar manualmente (o con Playwright) contra `vercel dev` real antes de dar por cerrado cualquier RF cuyo dato se escriba en un endpoint y se lea en otro. Ver [04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md) §7bis para la corrección aplicada (persistencia real en Supabase adelantada respecto al plan original).

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

- **Se ejecuta de verdad:** peer review del documento, pruebas unitarias sobre lógica de negocio, checklist Given/When/Then manual, un usability test con n = 1 (ver §2; [guion](../validation/01_Guion_Test_Usabilidad.md) y [resultados](../validation/02_Resultados_Test_Usabilidad.md)), un piloto corto con métricas básicas, y Playwright para lo que no toca `api/` (páginas públicas, ver `e2e/`, instalado 15 sept.).
- **Se documenta como diseño/trabajo futuro, sin ejecutar a escala real:** Playwright contra flujos que sí tocan `api/` (registro, login...) — pendiente decidir cómo aislar los datos de prueba (¿proyecto de Supabase dedicado? ¿limpieza tras cada test?) antes de automatizar nada que cree cuentas reales; A/B testing con significancia estadística.

Esto es coherente con lo que ya aceptamos en RES-10 para el contenido de otras funcionalidades: priorizar la demostración rigurosa del concepto y del método sobre la cobertura exhaustiva, dado el marco temporal del TFM.

---

## 5. Próximo paso

Con este plan aprobado, seguimos con el archivo 3: **justificación del ciclo de vida** (por qué un modelo espiral ligero encaja con este proyecto, y cómo se estructuran los ciclos desde el MVP).

---

## Historial de cambios

- **v1.0 (5 sept. 2026)** — versión inicial: técnicas de verificación (peer review, tests unitarios/integración, UAT Given/When/Then, criterios ejecutables opcionales) y validación (demos, usability testing 5 personas, piloto 5-10 personas, métricas, A/B documental).
- **v1.1 (6 sept. 2026)** — ajustes tras revisión:
  - Peer review marcado en espera (sin acceso a tutor/compañeros por ahora).
  - Usability testing y pilot testing ajustados a la disponibilidad real (n=1, mi pareja), documentando la limitación frente a la muestra ideal.
  - Automatización con Playwright de los criterios de aceptación pasa de "opcional" a prioridad Alta, específicamente para todos los RF de prioridad Must.
- **v1.1 (14 sept. 2026)** — §1bis: caso real de un límite estructural de Vitest (no detecta que los datos no sobreviven entre funciones serverless distintas) encontrado al implementar RF-03.
- **v1.2 (15 sept. 2026)** — Playwright instalado de verdad (§1, §4): primer test cubre solo páginas públicas. Automatizar RF-01 (registro/login) — el caso que motivó §1bis — queda pendiente de decidir aislamiento de datos de prueba en Supabase.
- **v1.3 (26 sept. 2026)** — §4 corregido: decía "usability test de 5 personas", contradiciendo el ajuste a n = 1 de §2. Enlaces al guion y a la hoja de resultados del test del MVP.
