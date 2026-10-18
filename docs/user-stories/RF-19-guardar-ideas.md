# Historia: Guardar, hacer o descartar una idea (RF-19)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-19 (Should; aplazado desde RF-18), RF-18 (ideas para las categorías bajas), UX-05 (carrusel de ideas), RF-40 (ideas personalizadas), RF-05 (exportar y borrar), segunda prueba con una usuaria (12 oct.), decisión del autor del 12 oct.

Como persona que ve una idea que le gusta
Quiero guardarla
Para no haberla olvidado al día siguiente

## Alcance

- **Tres reacciones a una idea**, que son las tres de RF-19 aplicadas a cada idea del carrusel y no a la recomendación entera:

  | En la app | En RF-19 | Qué pasa |
  |---|---|---|
  | **Me gusta** (pulgar arriba) | pospuesta | Queda en "Tus ideas guardadas", en Inicio |
  | **Hecha** | hecha | Sale de las guardadas; queda anotada |
  | **No me gusta** (pulgar abajo) | descartada | Deja de salir en el carrusel de esa categoría |

- **Por qué por idea:** una recomendación es "hay ideas para esta categoría", y el carrusel enseña varias. Lo que la persona quiere recordar o apartar es una idea concreta.
- **En el carrusel:** cada idea lleva dos botones, "Me gusta" y "No me gusta". "Me gusta" la guarda y lo dice con un mensaje ("Se ha guardado la idea"); pulsarlo otra vez deja de guardarla. "No me gusta" la aparta: la ventana dice cuántas hay apartadas y ofrece recuperarlas. Si faltan ideas por lo marcado en "¿Qué te lo pone difícil?" (RF-42), también lo explica.
- **La idea, más destacada:** texto mayor, en un bloque propio sin adornos, con las acciones debajo. En la prueba pasaba desapercibida. La ventana es más ancha, todas las pestañas tienen la misma altura, y pestañas y flechas llevan el color de la marca, con aspecto de botón.
- **En Inicio:** "Tus ideas guardadas", con cada idea, su categoría y los botones "Hecha" y "Quitar". Sin ideas guardadas, no se muestra.
- **Lo que se guarda:** la clave de la idea del catálogo, la categoría, la reacción y la fecha. Nunca el texto: se guarda la idea original aunque se estuviera viendo personalizada por la IA (RF-40), y se muestra en el idioma de la interfaz.
- **Solo ideas de la app.** Las experiencias de otras personas (RF-43) no se guardan con esto.
- **Datos (RF-05):** las reacciones entran en la exportación y se borran con la cuenta.
- **Fuera de alcance:** "me gusta" como valoración (no alimenta nada y sería ponerle nota a la idea), el comentario al marcar una idea como hecha (RF-35), recordatorios de las ideas guardadas.

## Criterios de aceptación

1. Given una idea del carrusel de una categoría propia
   When se pulsa "Guardar"
   Then aparece en "Tus ideas guardadas" de Inicio, también tras recargar

2. Given una idea guardada
   When se marca "Hecha" o "Quitar"
   Then deja de estar en las guardadas

3. Given una idea del carrusel
   When se pulsa "No me gusta"
   Then deja de salir en el carrusel de esa categoría

4. Given todas las ideas de una categoría descartadas
   When se abre la ventana de ideas
   Then se explica que no quedan y se pueden recuperar

5. Given una petición directa con una categoría que no es de esa persona, o con una idea que no pertenece a esa categoría
   When llega al servidor
   Then se rechaza

6. Given una idea que se estaba viendo personalizada por la IA
   When se guarda
   Then se guarda la idea original del catálogo

7. Given una persona con reacciones
   When exporta sus datos o elimina su cuenta
   Then aparecen en la exportación y desaparecen con la cuenta

## Historial de cambios

- **v1.0 (12 oct. 2026)** — versión inicial. La usuaria de la prueba pedía "me gusta / no me gusta"; se convierte en guardar y descartar, que es lo que resuelve su problema (olvidar la idea) sin poner nota a nada.
- **v1.1 (13 oct. 2026)** — tras verla el autor: botones "Me gusta" / "No me gusta" con mensaje al guardar, en lugar de "Guardar idea" / "No me sirve" (el efecto es el mismo: guardar y apartar); ventana más ancha, de altura fija, con pestañas y flechas como botones; aviso de cuántas ideas no se ven y por qué.
