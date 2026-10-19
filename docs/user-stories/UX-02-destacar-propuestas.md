# Historia: Destacar las propuestas de la app

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** [resultados de la validación](../validation/02_Resultados_Test_Usabilidad.md) (problema 3, gravedad 2: pidió una "calculadora" y sugerencias cuando un área está baja, que ya existen), RF-14/RF-16 (panel), RF-18 (recomendaciones), RN-04 (tono no punitivo), RES-05 (aviso), RES-07 (sin ventanas que se abran solas)

Como usuario que acaba de puntuar sus áreas
Quiero ver enseguida cómo está cada una y qué me propone la app
Para no tener que buscar lo que la app ya sabe decirme

## Alcance

- **Banda en texto en cada tarjeta del panel:** junto a la puntuación actual, su banda ("Bajo", "Casi bajo", "Medio", "Bueno"), con los mismos textos y colores suaves que Resultados. Es la "calculadora" que pedía: ya existía en Resultados, no en Inicio.
- **Resumen "Ideas para ti" arriba del panel**, cuando hay alguna recomendación abierta: una frase ("Para las áreas con la puntuación más baja. Tú decides si te sirven.") y un botón por idea ("Idea para Economía"), que abre la misma ventana que el botón de la tarjeta (con el aviso de RES-05). Sin recomendaciones, el resumen no aparece.
- **Tono (RN-04):** sin contar ni ordenar "lo peor"; la frase deja la decisión al usuario. Nada se abre solo (RES-07).
- **Sin datos nuevos ni endpoint nuevo.**
- **Fuera de alcance:** frases inspiradoras (necesitan textos nuevos en el catálogo curado; pendientes de aprobar), recomendaciones generadas o adaptadas con IA (decisión abierta, Ciclo 2).

## Criterios de aceptación

1. Given una categoría puntuada en el panel
   When se muestra su tarjeta
   Then junto a la puntuación aparece su banda en texto

2. Given recomendaciones abiertas
   When el usuario llega a Inicio
   Then ve arriba "Ideas para ti" con un botón por categoría, y al pulsar uno ve la idea con el aviso de RES-05

3. Given ninguna recomendación abierta
   When el usuario llega a Inicio
   Then no aparece el resumen

## Notas de diseño

- Los textos de las bandas pasan de `ScoreCards` a `scoreBand.ts` (`BAND_LABEL_KEYS`), para que Resultados e Inicio usen los mismos.
- `RecommendationButton` acepta una etiqueta opcional: el mismo botón y la misma ventana en la tarjeta y en el resumen.
- `IdeasSummary` en `panel/ui/home/`, compuesto en `Dashboard` como el resto del panel.
