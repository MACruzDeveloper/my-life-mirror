# Historia: Panel general — puntuación actual de cada categoría activa

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-14 (Must), RN-06 (resumen rápido — [03_Matriz_Trazabilidad_Fase1.md](../requirements-analysis/03_Matriz_Trazabilidad_Fase1.md) traza RF-14 desde RN-06, no desde RN-03), RN-01, RN-04, RF-06/RF-07 (categorías activas), RF-10 (evaluaciones), RF-18 (recomendaciones), [RF-06-RF-07-categorias.md](RF-06-RF-07-categorias.md), [RF-18-recomendaciones.md](RF-18-recomendaciones.md)

> **Fuera de alcance de esta historia, a propósito:** RF-15 (gráfico radar de equilibrio, Should), RF-16 (gráfico de líneas de evolución temporal, Should) y RF-17 (puntuación global ponderada, Could) son historias propias, todavía sin planificar. La evolución histórica (RN-03, Must) traza precisamente a RF-16, no a RF-14 — confundirlas habría hecho esta historia mucho más grande de lo que pide el requisito. Este panel muestra el **estado actual**, no la evolución.

Como usuario con sesión iniciada
Quiero ver, de un vistazo al entrar, la puntuación actual de cada categoría que sigo
Para saber dónde estoy sin tener que ir categoría por categoría

## Alcance

- **Dónde vive:** `/inicio` (`Home`), la pantalla a la que se llega tras iniciar sesión (RF-39). Es el "panel general" del requisito.
- **Qué muestra:** una tarjeta por cada categoría **activa** del usuario (RF-06/RF-07), con su **última** puntuación (RF-10) — o "todavía sin puntuar" si la activó pero no la ha puntuado nunca. Las categorías inactivas no aparecen.
- **Compone evaluaciones + recomendaciones** (tal como pedía el tablero): la tarjeta de una categoría con una recomendación abierta (RF-18) la muestra debajo, con el aviso de RES-05. Esto ya estaba construido al implementar RF-18 (que especifica explícitamente Inicio como uno de los sitios donde se ve la recomendación); esta historia lo reconoce como parte de RF-14 y lo cubre con sus propios criterios de aceptación.
- **Primera vez** (ninguna puntuación todavía, con independencia de si hay categorías activas o no): en vez de un panel vacío, una invitación a hacer la primera entrevista (ya construido, RF-39/RF-10).
- **Fallo de carga:** un error al pedir las puntuaciones se distingue de "primera vez" — mismo título neutro del panel, aviso de error y botón para reintentar. No debe mostrarse la bienvenida de primera vez ("Empecemos por conocerte") ante un fallo técnico: son dos situaciones distintas y el texto de una no vale para la otra.
- **Inicio vs. Resultados** (desde RF-16): Inicio muestra por categoría la puntuación actual y su gráfico de evolución; las tarjetas de detalle (nota, fecha, banda) se quedan en Resultados, enlazado desde el panel. La puntuación actual sigue en cada tarjeta, así que RF-14 se cumple igual.
- **Acceso a la entrevista:** botón "Actualizar mis respuestas" (no "Nueva entrevista": la entrevista es solo la primera vez, luego se actualiza).
- **Tono** (RN-04): sin alarmas ni comparaciones entre usuarios; los colores de banda de `ScoreCards` ya cumplen esto (RF-10).

## Nota de diseño — sin un caso de uso combinado en el servidor

El tablero describía esta tarea como un caso de uso de solo lectura `ConsultarPanelGeneral` que compusiera evaluaciones y recomendaciones. Se descarta esa forma concreta a favor de **componer en la pantalla** (`Home.tsx`) dos piezas ya existentes e independientes: `GetLatestScores` (evaluaciones) y `ListRecommendations` (recomendaciones), cada una con su propio endpoint y su propia clave de caché.

Motivos:
- Ambas ya están hechas, probadas y cacheadas por separado (`["assessments","latest"]`, `["assessments","recommendations"]` — la segunda vive deliberadamente bajo el prefijo de la primera para invalidarse junto a ella, ver `queries.ts`).
- Un caso de uso combinado en el servidor acoplaría el módulo `assessments` a `recommendations` (o exigiría un módulo nuevo solo para componer), sin ganar nada que la composición en la pantalla no dé ya: la pantalla necesita el nombre de la categoría, su puntuación y, si la hay, su recomendación — un simple cruce por `categoryId`.
- Añadir un endpoint nuevo solo para esto gastaría una función serverless más (10/12 hoy, [03_Arquitectura_Software.md](../architecture-decisions/03_Arquitectura_Software.md) §6.1) sin necesidad.

Si en el futuro el panel crece (RF-15/RF-16/RF-31) y la composición en la pantalla se vuelve difícil de mantener, ese es el momento de mover la composición al servidor — no antes (YAGNI).

## Criterios de aceptación

1. Given un usuario con categorías activas puntuadas
   When entra en `/inicio`
   Then ve una tarjeta por cada categoría activa con su última puntuación, y ninguna de las inactivas

2. Given una categoría activa que nunca se ha puntuado
   When entra en `/inicio`
   Then esa tarjeta dice que todavía no tiene puntuación, no un error ni un hueco vacío

3. Given una categoría con una recomendación abierta (RF-18)
   When entra en `/inicio`
   Then ve la recomendación dentro de la tarjeta de esa categoría, con el aviso de que no sustituye asesoramiento profesional

4. Given un usuario que todavía no ha puntuado ninguna categoría
   When entra en `/inicio`
   Then ve la invitación a hacer su primera entrevista, no un panel vacío

5. Given un fallo al cargar las puntuaciones
   When entra en `/inicio`
   Then ve un aviso de error y un botón para reintentar — nunca el texto de "primera vez"

6. Given un fallo al cargar las recomendaciones (pero las puntuaciones sí cargan)
   When entra en `/inicio`
   Then el panel se ve igualmente, sin recomendaciones y sin bloquear nada (son secundarias)

## Historial de cambios

- **v1.0 (26 sept. 2026)** — versión inicial: se documenta y cierra RF-14 formalizando lo ya construido durante RF-18 (composición en pantalla, no un caso de uso combinado) y corrigiendo la confusión entre error de carga y primera vez.
- **v1.1 (26 sept. 2026)** — el botón pasa de "Nueva entrevista" a "Actualizar mis respuestas".
- **v1.2 (26 sept. 2026)** — las tarjetas de Inicio pasan a incluir el gráfico de evolución (RF-16); las de detalle se quedan en Resultados.
