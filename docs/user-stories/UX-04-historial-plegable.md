# Historia: Historial de cambios plegado

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-10 (entrevista), RN-04 (tono no punitivo), RNF-06 (móvil primero), petición del autor del 29 sept. (plan del Ciclo 2)

Como usuario que vuelve a actualizar sus respuestas
Quiero que el historial no ocupe la entrevista, pero poder consultarlo cuando quiera
Para centrarme en contestar y mirar atrás solo si me interesa

## Alcance

- El historial sigue en la entrevista (a un lado en escritorio, debajo en móvil), pero **plegado**: solo se ve el título y un botón "Ver mi historial (N)", con N = número de veces que se ha guardado.
- Al abrirlo, una **línea de tiempo por meses**, de lo más reciente a lo más antiguo: el mes como encabezado y, en cada guardado, el día y los cambios ("Economía: 6 → 4").
- Se muestran los **5 guardados más recientes**; "Ver más" enseña el resto. Sin buscador: el historial crece más o menos un guardado al mes.
- Sin guardados: se dice "Todavía no has guardado nada." y no hay botón.
- Mismos datos y misma caché que ahora (`useAssessmentHistory`): abrir y cerrar no repite ninguna llamada.

## Criterios de aceptación

1. Given un usuario con guardados
   When abre la entrevista
   Then ve "Ver mi historial (N)" y no los cambios

2. Given el historial plegado
   When pulsa "Ver mi historial"
   Then ve los guardados agrupados por mes, del más reciente al más antiguo, y el botón pasa a "Ocultar historial"

3. Given más de 5 guardados
   When abre el historial
   Then ve los 5 más recientes y "Ver más", que muestra el resto

4. Given ningún guardado
   When abre la entrevista
   Then ve "Todavía no has guardado nada." sin botón
