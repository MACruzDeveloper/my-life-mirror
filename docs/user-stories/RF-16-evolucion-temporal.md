# Historia: Evolución temporal de cada categoría

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-16 (Should), **RN-03 (Must)** — [03_Matriz_Trazabilidad_Fase1.md](../requirements-analysis/03_Matriz_Trazabilidad_Fase1.md) traza RN-03 a RF-12, RF-16 y RF-36; con RF-12 ya cubierto (registro inmutable) y RF-36 como Could, RF-16 es lo que cierra el Must. También RF-14 (panel general), RF-18 (recomendaciones), RN-04 (tono no punitivo), [RF-14-panel-general.md](RF-14-panel-general.md)

Como usuario que ha ido actualizando sus respuestas
Quiero ver cómo ha cambiado la puntuación de cada categoría a lo largo del tiempo
Para darme cuenta de mi evolución, no solo de mi foto de hoy

## Alcance

- **Dónde:** en el panel (`/inicio`). Inicio pasa a ser la vista **gráfica** (una tarjeta con gráfico por categoría) y Resultados (`/perfil/resultados`) se queda con las tarjetas de detalle (nota, fecha, banda). Así dejan de ser dos pantallas iguales.
- **Qué:** una tarjeta por categoría **activa**, con su puntuación actual (lo que pide RF-14) y un gráfico de líneas con todas sus puntuaciones guardadas, de la más antigua a la más reciente. Si la categoría tiene una recomendación abierta (RF-18), aparece en su tarjeta, como antes.
- **Dos columnas** en escritorio (una en móvil), para que cada gráfico tenga espacio.
- **Forma: pequeños múltiplos**, un gráfico por categoría, no un gráfico con todas las líneas juntas. Con 9 categorías o más, un solo gráfico mezclaría demasiadas líneas y obligaría a distinguirlas solo por color; cada tarjeta lleva el nombre de su categoría, así que no hace falta leyenda.
- **Por meses y con escalas compartidas:** eje vertical fijo 1-10 y eje de tiempo **por meses** (una marca por mes, con el año en enero), con la **misma ventana de meses en todas las tarjetas**. Un único selector encima de las tarjetas decide la ventana: **6 meses**, **12 meses** o **Todo**, con flechas para ir a periodos anteriores (sin pasar de la primera respuesta ni del mes actual). Por defecto 12 meses; en móvil, 6 (las etiquetas de mes caben mejor). Si una línea viene de un punto fuera de la ventana, se corta en el borde en vez de desaparecer.
- **Casos con pocos datos:** sin ninguna puntuación → "Sin puntuar todavía"; con una sola → un punto y la explicación de que la evolución aparece a partir de la segunda respuesta.
- **Detalle:** al pasar el ratón (o tocar) un punto, un tooltip muestra puntuación y fecha. Para teclado y lectores de pantalla, cada gráfico tiene una descripción textual (primera y última puntuación, con fechas) y un botón **"Ver datos"** que abre una tabla con todas sus puntuaciones.
- **Tono (RN-04):** una sola línea en el color principal de la interfaz, sin rojo ni verde para "subir" o "bajar", y sin textos de juicio ("has empeorado"). Solo datos: primera y actual.
- **Sin endpoint nuevo:** se reutiliza `GET /api/assessments/history` (ya existe para el historial de cambios de la entrevista) y su caché; la forma para el gráfico se calcula en la pantalla. Seguimos en 10 de 12 funciones.
- **Categorías inactivas:** no se muestran (igual que en RF-14); sus puntuaciones se conservan y vuelven a verse si se reactiva.
- **Fuera de alcance:** RF-15 (radar de equilibrio), RF-17 (puntuación global), filtros por rango de fechas y RF-36 (preguntas en lenguaje natural).

## Criterios de aceptación

1. Given un usuario con varias puntuaciones guardadas en una categoría activa
   When entra en `/inicio`
   Then ve su tarjeta con la puntuación actual y un gráfico de líneas con todas sus puntuaciones, de la más antigua a la más reciente

2. Given una categoría activa con una sola puntuación
   When entra en `/inicio`
   Then ve un único punto y un texto que explica que la evolución aparece con la segunda respuesta

3. Given una categoría activa sin ninguna puntuación
   When entra en `/inicio`
   Then su tarjeta dice "Sin puntuar todavía", sin gráfico

4. Given un punto del gráfico
   When el usuario pasa el ratón por encima o lo toca
   Then ve la puntuación y la fecha de ese punto; y con "Ver datos" (accesible con teclado) ve todas las puntuaciones en una tabla

4b. Given el selector de periodo
   When el usuario elige 6 meses, 12 meses o Todo, o va a un periodo anterior
   Then todas las tarjetas pasan a mostrar exactamente los mismos meses; no se puede ir antes de la primera respuesta ni después del mes actual

5. Given cualquier gráfico
   When lo lee un lector de pantalla
   Then recibe una descripción textual con la primera y la última puntuación y sus fechas

6. Given una categoría inactiva con puntuaciones antiguas
   When entra en `/inicio`
   Then no aparece

7. Given una categoría con una recomendación abierta
   When entra en `/inicio`
   Then la recomendación sigue apareciendo en la tarjeta de esa categoría, con el aviso de RES-05

8. Given `/perfil/resultados`
   When lo abre
   Then sigue mostrando las tarjetas de detalle, sin gráficos

## Notas de diseño

- **Apache ECharts** (Apache-2.0, a petición del usuario), usado directamente con importaciones por partes (`echarts/core` + línea, rejilla, tooltip, render SVG), sin el envoltorio `echarts-for-react`. Sustituye al SVG propio de la v1.0: el eje por meses, el tooltip y la escala temporal los da la librería. Coste: ~175 kB comprimidos, que se **cargan solo al entrar en Inicio** (`React.lazy`): la portada, el login y el registro no los descargan.
- **Por qué un selector común y no desplazamiento horizontal dentro de cada gráfico:** en móvil, arrastrar un gráfico en horizontal compite con el desplazamiento vertical de la página, y cada tarjeta podría quedar en un periodo distinto, perdiendo la comparación. El selector resuelve ambas cosas y funciona igual con ratón, tacto y teclado.
- **Estructura (dónde está cada pieza):**
  - `src/shared/ui/charts/` — plantillas genéricas de gráficos, reutilizables en cualquier módulo: `TimeLineChart/` (plantilla de líneas sobre el tiempo, configurable por props: datos, ventana, eje vertical, color, texto del tooltip, descripción), `useEChart` (ciclo de vida común a cualquier tipo de gráfico), `echarts.ts` (registro de piezas), `timeWindow.ts` (ventanas por meses) y `ChartDataTable` (tabla accesible). Un tipo nuevo (p. ej. el radar de RF-15) es otra carpeta hermana que reutiliza `useEChart`.
  - `src/modules/assessments/ui/evolution/` — lo específico de las puntuaciones: `EvolutionPanel` (selector + rejilla), `PeriodSelector`, `CategoryEvolutionCard` (usa `TimeLineChart` con eje 1-10) y `scoreHistory`.
  - `src/modules/panel/ui/home/` — `Home` solo decide qué estado mostrar; `FirstTimeWelcome`, `LoadErrorState` y `Dashboard` son cada uno su componente.
- **Sin Zustand:** la caché de TanStack Query ya es única para toda la app; el historial se pide una vez y lo comparten Inicio y la Entrevista (hay un test que lo comprueba al navegar de una a otra).
- **Revisión visual:** en ambas versiones se renderizó el panel con datos de ejemplo en un navegador real (escritorio y móvil) antes de darlo por bueno. Con el SVG se detectó que cada gráfico tenía su propio eje de tiempo; con ECharts, que la etiqueta del mes final (límite exclusivo de la ventana) confundía. Ambas cosas tienen ya su test.
- **Transformación pura** (`buildCategoryTimeSeries`) entre la respuesta del historial y los gráficos, probada aparte.

## Historial de cambios

- **v1.0 (26 sept. 2026)** — versión inicial.
- **v1.1 (26 sept. 2026)** — eje de tiempo común a todas las tarjetas, tras la revisión visual.
- **v1.2 (26 sept. 2026)** — Apache ECharts (carga diferida) en lugar del SVG propio; ventana de meses común con selector 6/12 meses/Todo y flechas; dos columnas; "Ver datos" como alternativa accesible.
- **v1.3 (26 sept. 2026)** — código reorganizado: plantilla genérica `TimeLineChart` en `shared/ui/charts/`, lo específico en `assessments/ui/evolution/`, Inicio dividido en subcomponentes; la propia tarjeta muestra la carga y el error del historial.
