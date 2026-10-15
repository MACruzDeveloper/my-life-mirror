# Historia: Ideas para disfrutar cuando todo va bien (RF-50)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-50 (Could), RF-18 (ideas para las categorías bajas), RD-09 (catálogo curado), RES-05 (sin consejo profesional), RN-04 ("un espejo, no un examen"), decisión del autor del 15 oct.

Como persona a la que le va bien en todas sus categorías
Quiero que la app no me empuje a mejorar más
Para disfrutar de lo que ya tengo

## Alcance

- **Cuándo:** todas las categorías activas tienen puntuación, son al menos tres y todas están en la banda alta (8 o más). Si una sin puntuar o una por debajo de 8, no sale.
- **Dónde:** en Inicio, una tarjeta "Todo va bien" en lugar de "Ideas para ti" (que con todo en verde no tiene nada que proponer): dice que no hace falta mejorar nada y enseña una idea para disfrutar, con un botón para ver otra.
- **El catálogo:** ocho ideas de disfrute y descanso, curadas como las demás (CAT-01: claves en `recommendations/domain/catalog/leisureIdeas.json`, textos en las traducciones). Incluye tomarse un descanso de la propia app. Ninguna es consejo de salud.
- **En la entrevista:** al guardar la nota que deja todo en verde, un aviso de unos segundos lo dice y enlaza a Inicio ("Ver ideas en Inicio"). Solo al llegar a ese estado, no cada vez que se guarda otra nota alta (entonces sale el mensaje de siempre, UX-09).
- **Sin IA:** el texto es siempre el del catálogo.
- **Sin datos nuevos:** se calcula con las últimas puntuaciones que Inicio ya tiene; no se guarda nada.
- **Aviso de RES-05:** como en todas las ideas.
- **Fuera de alcance:** guardar estas ideas o ponerles fecha (RF-19 y RF-47 van por categoría), personalizarlas con IA.

## Criterios de aceptación

1. Given tres o más categorías activas, todas puntuadas con 8 o más
   When se abre Inicio
   Then se ve "Todo va bien" con una idea para disfrutar y el aviso de RES-05

2. Given esa tarjeta
   When se pulsa "Otra idea"
   Then se ve otra idea del catálogo, y al llegar a la última se vuelve a la primera

3. Given una categoría activa con menos de 8, o una sin puntuar, o menos de tres categorías
   When se abre Inicio
   Then no se ve la tarjeta

4. Given tres categorías con 8, 8 y 5
   When se sube la tercera a 8 y se guarda en la entrevista
   Then un aviso dice que todo está en verde y enlaza a Inicio; si ya estaba todo en verde, guardar otra nota alta no lo repite

5. Given el catálogo
   When se comprueba
   Then cada idea tiene texto en español y en inglés, y ninguna usa palabras de consejo médico, financiero o psicológico

## Historial de cambios

- **v1.0 (15 oct. 2026)** — versión inicial.
- **v1.1 (15 oct. 2026)** — tras probarlo el autor: el aviso en la entrevista al llegar a "todo en verde", con enlace a Inicio.
