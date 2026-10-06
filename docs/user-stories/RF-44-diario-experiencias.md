# Historia: Diario de experiencias por categoría (RF-44)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-44 (Should, Ciclo 2), RF-11 (nota libre), RF-41 (experiencia privada), RF-12 (evaluaciones inmutables), RF-05 (exportar y borrar), RF-30 (líneas de ayuda), RES-09, petición del autor del 5 oct.

Como usuario que quiere recordar qué le ha pasado en una categoría
Quiero apuntar varias experiencias, verlas y borrar las que ya no quiero
Para tener un diario propio que me ayude a entender por qué mis puntuaciones suben o bajan

## Contexto

Hasta ahora, "Tu experiencia (privada)" era una nota que solo se guardaba junto con una puntuación, al pulsar "Guardar" (lejos del campo). El usuario no veía que pasara nada al escribirla, solo cabía una por guardado y no se podía borrar: iba dentro de la evaluación, que es inmutable (RF-12).

## Alcance

- **"Tus experiencias"** en cada pregunta (sustituye al campo de nota): un campo para escribir y un botón **"Añadir"** que la guarda al momento, sin necesitar puntuación. Al guardarse, "✓ Guardada" en la línea del título y la experiencia entra arriba de la lista con la animación de las categorías nuevas.
- **La lista** de experiencias de la categoría, la más reciente primero, con su fecha. Se ven las 3 últimas y "Ver todas (N)".
- **Eliminar** cada una (con confirmación: no se puede deshacer).
- **Siguen siendo privadas:** solo las ve el usuario; nunca se comparten ni van a la IA, salvo que el usuario lo pida expresamente para una experiencia concreta (RF-45). El aviso del campo se mantiene.
- **El enlace a las líneas de ayuda junto al diario** (ayuda ofrecida a todos, sin detectar nada, RES-09) llega con RF-30, que aún no tiene pantalla a la que enlazar.
- **Datos:** una tabla propia, `experiences` (usuario, categoría, texto, fecha), separada de las evaluaciones, que siguen siendo inmutables. Las notas que ya existen en las evaluaciones se copian a la tabla nueva (migración, con la fecha de su evaluación), y la entrevista deja de enviar nota al guardar. La nota original se conserva en su evaluación como dato histórico (RF-12), pero la interfaz ya no la enseña: las experiencias se ven desde su tabla, para no verlas dos veces. Entran en la exportación y se borran con la cuenta (RF-05).
- **Dónde se ven:** la lista en cada pregunta (sustituye a "Tu última experiencia") y el historial de Resultados, en su día.
- **"Guardar" vuelve a ser solo para la puntuación:** escribir una experiencia ya no lo activa (tiene su propio "Añadir").
- **API:** acciones `experiences` (listar, añadir y borrar) en un router existente, sin función nueva.
- **Fuera de alcance:** editar una experiencia (se borra y se escribe otra), adjuntos, compartirlas (llega con RF-43) y la IA (RF-45).

## Criterios de aceptación

1. Given una categoría
   When escribe una experiencia y pulsa "Añadir"
   Then ve "✓ Guardada" y la experiencia arriba de la lista, con la fecha de hoy, sin haber guardado puntuación

2. Given varias experiencias en una categoría
   When abre la entrevista
   Then ve las 3 más recientes y "Ver todas (N)"

3. Given una experiencia
   When pulsa eliminar y lo confirma
   Then desaparece de la lista y del historial, y no vuelve al recargar

4. Given notas guardadas antes de este cambio
   When abre la entrevista
   Then aparecen como experiencias, con la fecha de su evaluación

5. Given el diario de una categoría
   When lo mira
   Then ve el aviso de privacidad (el enlace a las líneas de ayuda llega con RF-30)

6. Given experiencias guardadas
   When exporta o borra su cuenta (RF-05)
   Then salen en la exportación / se borran

## Historial de cambios

- **v1.0 (5 oct. 2026)** — versión inicial. Petición del autor: "al añadir una experiencia no veo que afecte a la app… el usuario debe poder añadir más de una experiencia, y también eliminarlas".
- **v1.1 (5 oct. 2026)** — antes de implementarla: el enlace a las líneas de ayuda pasa a RF-30 (no tiene pantalla todavía); la nota antigua se conserva en su evaluación pero solo se enseñan las experiencias; "Guardar" vuelve a ser solo para la puntuación.
- **v1.2 (5 oct. 2026)** — compartir una experiencia de forma anónima llega con [RF-43](RF-43-experiencias-compartidas.md).
