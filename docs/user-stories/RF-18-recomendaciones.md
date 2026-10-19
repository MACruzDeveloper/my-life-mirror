# Historia: Recomendaciones cuando una categoría puntúa bajo

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-18 (Must), RN-02, RD-04, RD-09, RN-04, RES-05, RES-07, RES-09, [09_Diagrama_Estados_Recomendacion.md](../requirements-analysis/09_Diagrama_Estados_Recomendacion.md), [RF-10-entrevista.md](RF-10-entrevista.md)

Como usuario que ha puntuado bajo una categoría
Quiero recibir una idea concreta y amable para mejorarla
Para tener un primer paso pequeño, sin que la aplicación me juzgue ni me agobie

## Alcance de este corte

- **Generación (RF-18):** al guardar puntuaciones, por cada categoría con puntuación **por debajo del umbral** se crea una recomendación con **una acción concreta** de un catálogo curado (no generado por IA: RES-09/RD-09). Categorías sin plantillas propias (p. ej. las que cree el admin, ADM-02) usan plantillas generales con el nombre de la categoría.
- **Entidad `Recomendación` (RD-04):** usuario, categoría, plantilla (clave del texto), umbral con el que se disparó, estado y fecha. El estado existe ya en el modelo (`pending`, `done`, `discarded`, `postponed`), pero **en este corte solo se crea `pending`**: marcar como hecha/descartada/pospuesta es **RF-19** (Should), siguiente paso natural.
- **Dónde se ve:** en la tarjeta de la categoría (Inicio y Resultados) aparece un **botón destacado "Una idea para ti"** (amarillo suave con una bombilla: se nota sin sonar a aviso). La idea y el aviso de RES-05 se leen en una **ventana que solo se abre al pulsarlo** — nunca sola (RN-04, RES-07: sin "dark patterns"). Así el usuario sabe de un vistazo qué categorías tienen propuestas sin que la pantalla se llene de texto.
- **Solo mientras la condición se mantiene:** la nota se muestra únicamente mientras la última puntuación de esa categoría siga por debajo del umbral y la categoría esté activa. Si el usuario mejora (o desactiva la categoría), la nota desaparece sola; el registro se conserva para el historial (RF-34).
- **Tono:** los textos son sugerencias en positivo ("si te apetece…", "un paso pequeño"), nunca reproches ni diagnósticos (RES-07/RES-09).
- **Aviso legal (RES-05):** junto a las recomendaciones, un texto fijo: son ideas generales de bienestar, no sustituyen el asesoramiento médico, financiero o psicológico profesional.
- **Umbral configurable:** valor por defecto **5** (se recomienda cuando la puntuación es 1-4). Se lee de la variable de entorno `RECOMMENDATION_THRESHOLD` (entero 2-10); un valor ausente o inválido usa el 5. **Fuera de alcance:** un ajuste desde la interfaz (por usuario o para todos) — se decidirá con RF-19/RF-20.
- **Persistencia real desde el principio** (Supabase, `supabase/migrations/0007_recommendations.sql`) y **cubierta por RF-05**: se exporta con el resto de los datos y se borra con la cuenta.
- **Textos en el idioma del usuario:** la base de datos guarda la *clave* de la plantilla (`economia.1`), no el texto; la interfaz lo traduce (ES/EN).

## Criterios de aceptación

1. Given un usuario que guarda una puntuación por debajo del umbral en una categoría activa
   When se guardan las puntuaciones
   Then se crea una recomendación pendiente para esa categoría, con una plantilla de su catálogo

2. Given una puntuación igual o superior al umbral
   When se guarda
   Then no se crea ninguna recomendación

3. Given una categoría que ya tiene una recomendación abierta (pendiente o pospuesta)
   When el usuario vuelve a guardar una puntuación baja en ella
   Then no se crea otra (como mucho una abierta por categoría: sin acumular avisos)

4. Given una categoría que ya tuvo recomendaciones anteriores
   When se genera una nueva
   Then se elige una plantilla que el usuario aún no haya recibido para esa categoría (y si ya las recibió todas, se repite desde la primera)

5. Given una categoría sin plantillas propias (p. ej. creada por el admin)
   When puntúa bajo
   Then se usa una plantilla general con el nombre de la categoría

6. Given una recomendación pendiente
   When el usuario mira sus resultados (Inicio o Resultados)
   Then ve en la tarjeta de esa categoría el botón destacado "Una idea para ti", y al pulsarlo lee la idea junto al aviso de RES-05, y solo mientras la última puntuación siga por debajo del umbral y la categoría esté activa

7. Given un fallo al generar recomendaciones
   When se guardan las puntuaciones
   Then el guardado sigue siendo correcto (las recomendaciones son secundarias; el fallo se registra en el log)

8. Given un usuario que exporta o elimina su cuenta (RF-05)
   When lo hace
   Then sus recomendaciones se incluyen en la exportación y se borran con la cuenta

## Notas de diseño

- **Disparo:** `RecordAssessments` avisa, *después* de persistir, a un oyente opcional (`onRecorded`). Es el equivalente en proceso del evento de dominio del ADR-03 apartado 3.4 sin el patrón Outbox (una tabla y un proceso aparte que hoy no aportan: hay una sola operación y un solo oyente); si un día hay varios oyentes o hace falta fiabilidad entre procesos, se sustituye por Outbox sin tocar el dominio. El oyente es *best effort*: un fallo no deshace el guardado.
- **Cálculo al leer:** `ListRecommendations` filtra al leer (categoría activa + última puntuación bajo el umbral con el que se creó) en vez de mantener el estado sincronizado al escribir — menos piezas que puedan quedar inconsistentes.
- **Catálogo en código, no en BD:** RD-09 (catálogo versionable sin tocar código) es Could. Las plantillas viven en las traducciones; el modelo ya guarda claves, así que moverlas a una tabla más adelante no cambia la entidad.
- **Módulo propio** `recommendations` (Clean Architecture) con su repositorio; se enlaza con evaluaciones y categorías solo por sus puertos.
