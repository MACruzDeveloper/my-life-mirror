# Historia: Menos llamadas al guardar en la entrevista

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-10 (entrevista), RF-18 (recomendaciones), [UX-05](UX-05-respuesta-inmediata-entrevista.md) (guardar por categoría), [07_UI.md](../architecture-decisions/07_UI.md) (caché de datos del servidor), ADR-03, apartado 6.1 (funciones de Vercel), petición del autor del 4 oct.

Como usuario que guarda una categoría en la entrevista
Quiero ver al momento lo que ha pasado (y la idea, si la hay)
Para no esperar a que la pantalla vuelva a pedir datos que el servidor ya tenía al guardar

## Contexto

Con UX-05 se guarda categoría a categoría. Cada guardado hacía 4 llamadas: el `POST /api/assessments` y, al invalidar la caché de `["assessments"]`, otras 3 lecturas (últimas puntuaciones, historial y recomendaciones). El modal de la idea esperaba a que llegaran las recomendaciones. `/api/recommendations` es además otra función de Vercel, con su posible arranque en frío.

**Alternativa descartada: GraphQL.** Su ventaja es no traer datos de más, y aquí los datos ya son pequeños. El coste está en el número de idas y vueltas y en el arranque en frío. Además añadiría un servidor, un esquema y otra forma de cachear.

## Alcance

- **Servidor:** el `POST /api/assessments` responde también con `latest` (las últimas puntuaciones, la misma forma que `GET /api/assessments`) y `recommendations` (las abiertas, la misma forma que `GET /api/recommendations`), calculadas con los casos de uso que ya existen en la misma función. Si alguno falla, la respuesta va sin ese campo: el guardado ya es firme.
- **Cliente:** pone `latest` y `recommendations` en la caché y solo vuelve a pedir el historial (sin esperarlo). El modal de la idea sale con las recomendaciones de la respuesta. Si la respuesta no las trae (un servidor anterior durante un despliegue), se hace como antes.
- **Sin funciones nuevas** (siguen 11 de 12) ni cambios en la base de datos.

## Criterios de aceptación

1. Given la entrevista cargada
   When guarda una categoría
   Then se hacen 2 llamadas: el `POST /api/assessments` y el `GET` del historial

2. Given una puntuación baja que abre una idea nueva
   When la guarda
   Then el modal la enseña sin pedir las recomendaciones aparte

3. Given el servidor no devuelve las recomendaciones
   When guarda
   Then la pantalla las vuelve a pedir, como antes

## Medición (4 oct. 2026)

Cinco guardados seguidos (cuatro sin idea y uno con puntuación baja), con el Supabase local y el servidor de los E2E, dos veces antes y dos después:

| | Antes | Después |
|---|---|---|
| Llamadas por guardado | 4 | 2 |
| Hasta el modal de la idea | 225-316 ms | 110-159 ms |
| Hasta "Guardado ahora" | 93-163 ms | 94-159 ms (ya salía tras el POST) |

En local no hay latencia de red ni arranques en frío. En producción (Dublín, con Supabase) cada llamada evitada ahorra además su ida y vuelta y, en `/api/recommendations`, un posible arranque en frío, así que la mejora debería ser mayor. Lo vigila un E2E (`e2e/api/save-requests.spec.ts`), que falla si un guardado vuelve a hacer más de 2 llamadas.

## Historial de cambios

- **v1.0 (4 oct. 2026)** — versión inicial. Se escribió después del código, y no antes como manda el proceso: el alcance ya estaba en el tablero desde el mismo día y el cambio era pequeño, pero queda anotado.
