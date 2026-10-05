# Historia: Respuesta inmediata en la entrevista

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-10 (entrevista), RF-11/RF-41 (experiencia privada), RF-12 (registros inmutables), RF-18 (recomendaciones), RF-40 (ideas con IA, v1.1), RN-04 (tono), RES-07 (sin patrones que generen ansiedad), peticiones del autor del 3 oct.

Como usuario que actualiza una categoría en la entrevista
Quiero guardarla ahí mismo y ver al momento qué ha pasado y qué me propone la app
Para no tener que buscar un botón al final de la página ni ir a otra pantalla

## Alcance

- **Un botón "Guardar" en cada categoría**, a la derecha de su puntuación (debajo en móvil si no cabe). Se habilita cuando esa categoría tiene una puntuación distinta de la guardada o una experiencia escrita. Guarda solo esa categoría. Desaparece el botón único del final ("Guardar cambios"), que con varias categorías abiertas quedaba fuera de la vista.
- **Qué se ve al guardar:**
  - **Sin idea:** "✓ Guardado ahora" en la propia categoría, junto al botón (el usuario está ahí, lo ve seguro). Se quita en cuanto vuelve a cambiarla.
  - **Con idea nueva** (la puntuación baja ha abierto una recomendación que no estaba, RF-18): un **modal** con "Cambios guardados", la idea (personalizada si RF-40 está activado) con el aviso de RES-05, y los siguientes pasos: "Ver mis resultados", "Ir a Inicio" y "Seguir aquí". Solo con idea nueva, para no encadenar ventanas al guardar varias categorías: una idea sigue abierta hasta que el usuario la gestiona, y volver a guardar esa categoría no la repite (se ve "Guardado ahora"). Es la respuesta a una acción del usuario, no una ventana que se abre sola (RES-07).
  - **Si falla:** el error en la propia categoría; lo cambiado se conserva para reintentar.
- **La última actualización de cada categoría, bajo su pregunta:** "Última actualización: 18 de septiembre de 2026 · 6 → 4", y debajo tu última experiencia (privada) si la hay.
- **El historial cronológico sale de la entrevista** y pasa a **Resultados** como línea de tiempo **agrupada por día**: lo guardado el mismo día sale junto, aunque se guarde categoría a categoría. La evolución completa sigue en los gráficos de Inicio y Resultados.
- **Más de una idea (carrusel):** la ventana de ideas (la de "Cambios guardados" y la de "Una idea para ti" de Inicio y Resultados) enseña las 5 ideas del catálogo de la categoría, primero la recomendada, con "anterior/siguiente" e "Idea 2 de 5". Sigue siendo contenido curado (RD-09) y una sola recomendación por categoría (RF-18): el carrusel enseña alternativas, no crea recomendaciones. Con RF-40 activado, cada idea se personaliza al verla (RF-40 v1.1).
- **"¿Qué te ayuda?" cambia las ideas (con RF-40):** una idea personalizada se reescribe si cambian las opciones marcadas de su categoría. Mientras la categoría tenga una idea abierta, su pregunta enseña "Ideas para Economía", que abre el carrusel: al marcar una opción, las ideas están a un toque, sin ventanas que se abran solas (RES-07). La experiencia escrita **no** cambia las ideas: es texto libre y nunca va a la IA (RES-09). Sin RF-40 activado, las ideas son las del catálogo, tengan las opciones que tengan.
- **Panel de progreso (escritorio, columna derecha):** "3 de 5 respondidas" con una barra, y cada categoría activa con su estado: sin responder, sin guardar, guardada hoy o guardada el día X. Tocar una lleva a su pregunta. Se queda fijo al desplazarse. En móvil siguen los accesos directos de arriba.
- **Servidor:** cada guardado es el mismo `POST /api/assessments`, con una sola entrada. La personalización acepta qué idea del carrusel se ve (RF-40 v1.1, migración 0012).
- **Fuera de alcance (UX-06):** la selección de categorías en la columna derecha y el menú lateral plegable.

## Criterios de aceptación

1. Given una categoría sin cambios
   When el usuario la mira
   Then su "Guardar" está desactivado

2. Given cambia la puntuación de una categoría
   When pulsa su "Guardar"
   Then se guarda solo esa categoría y las demás no se tocan

3. Given guarda una categoría y no se abre ninguna idea nueva (no la hay, o ya estaba abierta)
   When termina el guardado
   Then ve "Guardado ahora" en esa categoría y no se abre ninguna ventana

4. Given guarda una puntuación baja que abre una idea nueva
   When termina el guardado
   Then se abre el modal con la idea, el aviso de RES-05 y los enlaces a Resultados e Inicio; "Seguir aquí" lo cierra

5. Given el guardado falla
   When el servidor responde con error
   Then el error se ve en esa categoría y lo cambiado se conserva

6. Given una categoría con guardados anteriores
   When abre la entrevista
   Then bajo su pregunta ve su última actualización (fecha y cambio) y su última experiencia, si la hay

7. Given varios guardados el mismo día
   When abre el historial en Resultados
   Then salen juntos bajo ese día

8. Given la ventana de una idea abierta
   When pulsa "siguiente"
   Then ve otra idea del catálogo de esa categoría, con su posición ("Idea 2 de 5") y el aviso de RES-05

9. Given una categoría con una idea abierta
   When mira su pregunta
   Then ve "Ideas para <categoría>", que abre el carrusel

10. Given RF-40 activado y una idea ya personalizada
    When cambia "¿Qué te ayuda?" de esa categoría y vuelve a ver la idea
    Then se pide de nuevo, con las opciones nuevas

11. Given varias categorías activas, en escritorio
    When mira la columna derecha
    Then ve cuántas ha respondido y el estado de cada una, y tocar una lleva a su pregunta

## Historial de cambios

- **v1.0 (3 oct. 2026)** — versión inicial: última experiencia bajo su pregunta, experiencia en el historial, mensaje junto al botón y la idea en el mensaje.
- **v1.1 (3 oct. 2026)** — tras probarla, el autor ve que el mensaje sigue quedando fuera de la vista y que el botón único del final no se encuentra: guardar por categoría, modal solo cuando el guardado abre una idea nueva ("Guardado ahora" si no), última actualización bajo cada pregunta y el historial a Resultados agrupado por día. La distribución de la pantalla (columna derecha y menú plegable) pasa a UX-06.
- **v1.2 (3 oct. 2026)** — tras probar la v1.1: el "Guardar" a la derecha de la puntuación; carrusel con las 5 ideas de la categoría; "Ideas para X" en la pregunta y las ideas personalizadas se reescriben al cambiar "¿Qué te ayuda?" (RF-40 v1.1); y el panel de progreso en la columna derecha, que se adelanta de UX-06 para no dejarla vacía. El autor decide hacerlo todo en esta historia.
- **v1.3 (5 oct. 2026)** — con RF-44, la última experiencia deja de salir bajo la pregunta (está en el diario de experiencias, en la misma pregunta) y el historial de Resultados enseña las experiencias del diario.
