# Historia: Primera entrevista por pasos

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-10 (entrevista), RF-07 (activar categorías), RF-04 (consentimiento), RNF-06 (mobile-first), [UX-01](UX-01-guia-primer-uso.md) (pasos de la primera vez), [UX-06](UX-06-distribucion-entrevista-menu.md) (distribución al actualizar), petición del autor del 4 oct.

Como usuario que hace su primera entrevista
Quiero ir paso a paso: saber de qué va, elegir mis categorías y después responder
Para ver qué preguntas estoy añadiendo y no perderme en una pantalla larga, sobre todo en el móvil

## Contexto

Hasta ahora, la primera entrevista lo enseñaba todo a la vez: la introducción, las dos columnas de casillas y, debajo, las preguntas. Al marcar una casilla, la pregunta aparecía o desaparecía más abajo, fuera de la vista, y el usuario no veía qué había añadido.

## Alcance

- **Solo la primera vez** (sin respuestas guardadas al abrir la entrevista). Quien ya tiene respuestas sigue con la distribución de UX-06.
- **Un indicador de pasos arriba** ("Introducción · Categorías · Preguntas") que marca dónde está el usuario.
- **Paso 1, Introducción:** el entrevistador explica de qué va y la escala (1 = muy mal · 10 = muy bien). Botón "Empezar".
- **Paso 2, Categorías:** "¿De qué quieres hablar?". Cada categoría es un botón grande con su nombre y su descripción, que se marca y desmarca al tocarlo, en lugar de una casilla. Hay un "Elegir todas" para las que no necesitan consentimiento. Las sensibles van aparte, con su explicación, y al elegirlas se pide el consentimiento como hasta ahora (RF-04). Elegir o quitar una la activa o desactiva al momento (RF-07), como en la entrevista de siempre. "Ir a las preguntas" se activa con al menos una elegida; "Atrás" vuelve a la introducción.
- **Paso 3, Preguntas:** la distribución de UX-06. Las categorías elegidas se ven y se pueden cambiar en sus acordeones (en la columna derecha en escritorio, encima de las preguntas en móvil), con el progreso. La introducción queda plegada en un acordeón, por si se quiere releer. Guardar la primera categoría no cambia la pantalla: el usuario sigue en sus preguntas.
- **Sin cambios en el servidor.**

## Criterios de aceptación

1. Given un usuario sin respuestas guardadas
   When abre la entrevista
   Then ve el paso 1 (introducción, escala y "Empezar"), con el indicador en "Introducción", y no ve aún las categorías ni las preguntas

2. Given el paso 2
   When toca una categoría
   Then queda marcada y activada; al tocarla otra vez, desmarcada

3. Given el paso 2 sin ninguna categoría elegida
   When mira "Ir a las preguntas"
   Then está desactivado

4. Given el paso 2
   When elige una categoría sensible
   Then se le pide el consentimiento antes de activarla

5. Given categorías elegidas en el paso 2
   When pulsa "Ir a las preguntas"
   Then ve sus preguntas, las categorías elegidas en su acordeón y la introducción plegada

6. Given el paso 3
   When guarda la primera categoría
   Then sigue en sus preguntas, sin volver a los pasos ni cambiar de distribución

7. Given un usuario con respuestas guardadas
   When abre la entrevista
   Then no ve los pasos: entra directamente a actualizar (UX-06)

## Historial de cambios

- **v1.0 (4 oct. 2026)** — versión inicial, a partir de la propuesta del autor del 4 oct. ("no me gusta que cuando selecciono los checkboxes el usuario no ve que se están añadiendo o eliminando preguntas abajo").
