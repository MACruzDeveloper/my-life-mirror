# Historia: Radar de equilibrio entre categorías

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-15 (Should, comprometido en el tablero), RN-06 (visión rápida del estado general), RN-04 (tono no punitivo), RF-14 (panel), [RF-16-evolucion-temporal.md](RF-16-evolucion-temporal.md)

Como usuario con varias categorías puntuadas
Quiero ver de un vistazo cómo están unas respecto a otras
Para darme cuenta de qué áreas de mi vida están más equilibradas y cuáles menos

## Alcance

- **Dónde:** en el panel (`/inicio`), en una tarjeta "Tu equilibrio" **encima** de la evolución: primero la foto de hoy, después cómo se ha llegado a ella.
- **Qué:** un gráfico radar con un eje por cada categoría **activa y puntuada**, con su **última** puntuación (la misma de RF-14). Un solo polígono: el estado actual.
- **Categorías sin puntuar:** no entran en el radar (no hay valor que dibujar); debajo se indica cuántas faltan, sin reproche ("Faltan por puntuar: Familia, Pareja").
- **Mínimo tres categorías puntuadas:** con menos no hay polígono que leer; se explica que el equilibrio aparece a partir de la tercera.
- **Lectura honesta del radar** (sus riesgos conocidos: la forma depende del orden de los ejes y el área exagera las diferencias):
  - **Orden fijo** de los ejes: el del catálogo de categorías, nunca ordenado por puntuación — si no, la forma cambiaría de una semana a otra sin que cambien los datos.
  - **Escala fija 0-10** en todos los ejes. Empieza en 0 y no en 1 para que una puntuación de 1 no quede pegada al centro, invisible.
  - Siempre acompañado de los números: tooltip con cada puntuación, descripción textual y tabla "Ver datos".
- **Tono (RN-04):** un único relleno suave en el color principal; sin zonas rojas ni verdes, sin marcar "lo peor".
- **Accesibilidad:** descripción textual con todas las categorías y sus puntuaciones, y tabla "Ver datos" (la misma alternativa que en RF-16).
- **Sin datos nuevos:** usa las últimas puntuaciones que el panel ya tiene en caché (`GET /api/assessments`). Sin endpoint nuevo: seguimos en 10 de 12 funciones.
- **Fuera de alcance:** comparar con un periodo anterior (segundo polígono), puntuación global (RF-17).

## Criterios de aceptación

1. Given un usuario con al menos tres categorías activas puntuadas
   When entra en `/inicio`
   Then ve la tarjeta "Tu equilibrio" con un radar de un eje por categoría puntuada, con su última puntuación, en el orden del catálogo

2. Given categorías activas sin puntuar
   When entra en `/inicio`
   Then no aparecen en el radar y la tarjeta indica cuáles faltan por puntuar

3. Given menos de tres categorías puntuadas
   When entra en `/inicio`
   Then la tarjeta explica que el equilibrio aparece a partir de la tercera categoría puntuada, sin dibujar un radar

4. Given el radar
   When un lector de pantalla llega a él
   Then recibe una descripción con cada categoría y su puntuación; y "Ver datos" muestra la misma información en una tabla

5. Given el radar
   When el usuario pasa el ratón o toca el polígono
   Then ve las puntuaciones de cada categoría

## Notas de diseño

- **Plantilla genérica** `RadarChart` en `src/shared/ui/charts/RadarChart/`, hermana de `TimeLineChart` y con el mismo ciclo de vida (`useEChart`): recibe los ejes, los valores, la escala y los textos por props, sin saber nada de categorías.
- **Lo específico** en `src/modules/assessments/ui/balance/`: `buildBalance` (qué categorías entran y cuáles faltan) y `BalanceCard`.
- Se carga en diferido junto a los demás gráficos (solo en Inicio); ECharts queda en un bloque compartido por ambos gráficos.
- **Seguridad:** es el primer gráfico cuyo tooltip lleva nombres de categoría, y ECharts pinta los tooltips como HTML. Como el admin puede crear categorías (ADM-02), un nombre como `<img src=x onerror=…>` se ejecutaría en el navegador de cada usuario: los nombres pasan por `escapeHtml` (`shared/ui/charts/`), con test.
- **Móvil:** con 9 ejes, "Espiritualidad" se cortaba en pantallas de 360 px. La plantilla tiene un modo compacto (radio y fuente menores) por debajo de `sm`; comprobado en navegador real que ninguna etiqueta se sale del gráfico.

## Historial de cambios

- **v1.0 (26 sept. 2026)** — versión inicial.
- **v1.1 (26 sept. 2026)** — implementada; escape de nombres en el tooltip y modo compacto en móvil tras la revisión en navegador.
