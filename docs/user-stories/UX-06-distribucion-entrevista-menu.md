# Historia: Distribución de la entrevista y menú plegable

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-10 (entrevista), RF-07 (activar/desactivar categorías), RF-04 (consentimiento), RNF-06 (mobile-first), [UX-05](UX-05-respuesta-inmediata-entrevista.md) (panel de progreso), peticiones del autor del 3 y 4 oct.

Como usuario que vuelve a actualizar sus respuestas
Quiero tener las preguntas delante y las categorías y el menú a mano, pero sin que ocupen la pantalla
Para centrarme en lo que quiero cambiar, también en el móvil

## Alcance

- **Categorías en acordeón, al actualizar** (con respuestas guardadas): "Tus categorías" y "Requieren tu consentimiento" pasan de las dos columnas encima de las preguntas a dos acordeones plegados, con un resumen en la cabecera ("3 de 6 activas"). En escritorio van en la columna derecha, encima del progreso. En móvil, encima de las preguntas. Funcionan igual que hasta ahora: activar y desactivar al momento, el consentimiento al marcar una sensible, "Seleccionar todas" solo en las que no lo necesitan.
- **La primera entrevista no cambia en esta historia:** sus pasos (intro → categorías → preguntas) son [UX-07](../project-management/01_Backlog_MVP.md).
- **La columna derecha entera se queda fija** al desplazarse (categorías arriba y el progreso debajo), bajo la cabecera; si no cabe en la pantalla, se desplaza por dentro.
- **El progreso también es un acordeón**, como los de las categorías, pero abierto por defecto; plegado conserva el resumen ("1 de 3 respondidas") y la barra.
- **Introducción y preguntas, en dos bloques con fondo distinto:** la introducción del entrevistador (y, en móvil o la primera vez, las categorías) en un bloque verde suave; las preguntas, con su título "¿Cómo te sientes en cada una?", en otro gris claro. Antes tenían el mismo estilo y la introducción quedaba pegada a las preguntas.
- **Una categoría recién añadida sale la primera** (la más reciente arriba, también en los accesos directos y en el progreso) y entra con una animación breve de derecha a izquierda. Solo `transform` y `opacity`, que el navegador anima sin recalcular la página, y sin animación si el usuario prefiere menos movimiento. Así se ve que se ha añadido su pregunta.
- **Reactivar una categoría no salta:** al volver a marcar una categoría que tenía puntuaciones, su pregunta aparece ya con la última puntuación. Antes salía "sin responder" y un segundo después saltaba a la guardada, porque el servidor solo devuelve las últimas puntuaciones de las categorías activas. Ahora se usa la que se veía al desactivarla o, si ya venía desactivada, la última del historial: lo mismo que devolverá el servidor.
- **Cabecera oscura y fija:** se queda arriba al desplazarse y, al bajar, se compacta (de 64 a 48 px de alto y letra más pequeña) con una transición breve.
- **Ajustes de la página:** los *breadcrumbs* de las pantallas protegidas, a la izquierda (en los formularios públicos siguen centrados, alineados con el formulario), y sin el margen superior de la entrevista.
- **Menú de Mi perfil como `Drawer` de Material UI:**
  - **Escritorio (md+):** fijo a la izquierda, con icono y nombre de cada sección, y un botón para plegarlo a solo iconos (el nombre sigue siendo su nombre accesible y sale al pasar el ratón). La preferencia se recuerda en este navegador (`localStorage`, como la guía de Inicio); si no se puede guardar, se pliega solo durante la visita.
  - **Móvil:** se abre desde un botón con el icono de menú ("Menú de mi perfil") y se cierra al elegir una sección, como hasta ahora.
- **Fuera de alcance:** los pasos de la primera entrevista (UX-07) y reducir las llamadas al guardar (mejora de rendimiento, en su propia PR).

## Criterios de aceptación

1. Given un usuario con respuestas guardadas
   When abre la entrevista
   Then ve "Tus categorías" y "Requieren tu consentimiento" plegados, cada uno con cuántas tiene activas, y las preguntas sin las dos columnas encima

2. Given abre "Tus categorías"
   When marca o desmarca una
   Then se activa o desactiva como hasta ahora (y una sensible pide consentimiento)

3. Given un usuario sin respuestas guardadas (primera entrevista)
   When abre la entrevista
   Then sigue viendo las dos columnas de categorías encima de las preguntas

4. Given el menú de Mi perfil en escritorio
   When pulsa "Plegar menú"
   Then el menú queda solo con iconos, cada uno con el nombre de su sección, y la elección se recuerda al volver; al desplazarse, pasa por debajo de la cabecera

5. Given el menú en móvil
   When pulsa "Menú de mi perfil" y elige una sección
   Then navega a ella y el menú se cierra

6. Given la entrevista con categorías activas
   When marca una categoría nueva
   Then su pregunta aparece la primera, con una animación de entrada (ninguna si prefiere menos movimiento)

7. Given la entrevista
   When baja de la introducción a las preguntas
   Then las ve en un bloque aparte, con otro fondo y su título

8. Given una categoría con puntuaciones guardadas, desactivada en esta visita o antes
   When la vuelve a marcar
   Then su pregunta aparece ya con su última puntuación, sin pasar por "sin responder"

9. Given cualquier pantalla protegida
   When baja por la página
   Then la cabecera sigue arriba, más compacta, y vuelve a su tamaño al subir
