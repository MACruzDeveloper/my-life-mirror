# Historia: Resultados en un gráfico de barras (UX-13)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-14 (puntuación actual de cada categoría), RF-18 (ideas al puntuar bajo), RN-04 (el sistema aconseja, no juzga), RNF-06 (mobile-first), RNF-10 (i18n), decisión del autor del 15 oct.

Como persona que mira sus resultados
Quiero ver todas mis categorías en un gráfico de barras
Para comparar de un vistazo dónde estoy mejor y dónde peor

## Por qué

Las tarjetas dicen el número de cada categoría, pero para comparar hay que leerlas una a una. Con barras en la misma escala (0 a 10), la comparación se ve sin leer: la pantalla que más se enseñará en la demo gana claridad.

## Alcance

- **Un gráfico de barras horizontales (ECharts)** con una barra por categoría puntuada, en el orden de siempre (el de la entrevista), escala común de 0 a 10 con guías cada 2 y el número escrito al final de cada barra.
- **Todas las barras del color de los gráficos** (el acento Country Blue, como el radar y la evolución): encaja con la paleta y con la entrevista. La banda ("Bueno", "Casi bajo"...) va escrita en el tooltip, en la descripción para el lector de pantalla y en la tabla de datos, no en el color.
- **Tooltip por fila:** al pasar por cualquier punto de la fila, la categoría, su nota, su banda y la fecha de la última puntuación.
- **"Ver datos":** la tabla plegable de los demás gráficos, con categoría, nota, nivel y fecha.
- **Sin puntuar:** debajo del gráfico, "Sin puntuar todavía: Aventura y Salud".
- **Ideas:** debajo, "Ideas para ti", con el nombre de cada categoría que tiene una idea abierta y el botón "Una idea para ti" de siempre (un gráfico no lleva botones).
- **Igual que antes:** el enlace a la entrevista y el historial de cambios. Sin cambios en el servidor.
- **Plantilla genérica:** `BarChart` en `shared/ui/charts/BarChart/`, hermana de `RadarChart` y `TimeLineChart`, con el mismo ciclo de vida (`useEChart`); la altura crece con el número de barras.

## Criterios de aceptación

1. Given dos categorías puntuadas con 8 y 2
   When se abren los resultados
   Then el gráfico tiene una barra para cada una, del color de los gráficos, y se describe como "Economía: 8 (Bueno), Deporte: 2 (Bajo)"; el tooltip y la tabla de datos dicen también la banda

2. Given una categoría sin puntuar
   When se abren los resultados
   Then no tiene barra y aparece en "Sin puntuar todavía"

3. Given una idea abierta en Deporte
   When se abren los resultados
   Then bajo "Ideas para ti" está Deporte con su botón "Una idea para ti", y ninguna otra categoría

4. Given la pantalla en inglés
   When se abren los resultados
   Then el gráfico usa el nombre traducido de cada categoría
