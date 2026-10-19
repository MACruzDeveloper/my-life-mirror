# Historia: Hitos en las páginas de Aventura y Deporte (RF-49)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-49 (páginas de categoría con recuerdos y logros), [RF-49 viajes](RF-49-paginas-de-categoria-y-viajes.md), RF-48 (eventos: mismo trato del texto libre), RF-05 (exportar y borrar), RN-04 (un recuerdo no cambia la nota), RES-09 (el texto libre no se analiza), decisión del autor del 15 oct.

Como persona que ha conseguido algo en una categoría
Quiero apuntarlo en su página
Para recordarlo y motivarme cuando me cueste

## Por qué

RF-49 abrió las páginas de categoría con los viajes de Aventura. Una sección común de **hitos** completa Aventura (los retos superados, no solo los viajes) y abre con la misma pieza una segunda página, **Deporte** (carreras, competiciones, marcas: "en Deportes gané esta competición", idea del autor).

## Alcance

- **Un hito:** un título corto (hasta 80 caracteres), un año y, si se recuerda, el mes. Es algo conseguido: del año 1900 al actual, no del futuro.
- **Dónde:** en la página de Aventura ("Retos superados", después de los viajes) y en la nueva página de **Deporte** ("Carreras, competiciones y marcas"). Cada página ve solo sus hitos. Deporte deja de salir como "Próximamente" en Categorías.
- **La página de Deporte:** la misma estructura que Aventura (descripción, tu nota, tus experiencias), con los hitos debajo.
- **La lista,** del más reciente al más antiguo, con un botón para borrar cada uno. Debajo, que no cambian la nota.
- **El título es texto libre y privado,** como los eventos del calendario: no se envía a la IA, no se comparte y no se analiza (RES-09).
- **No cambian ninguna nota** (RN-04): son memoria y motivación.
- **Exportar y borrar (RF-05):** los hitos van en la exportación de datos y se borran con la cuenta.
- **Datos:** tabla `milestones` (**migración 0031**), solo accesible desde el servidor (RLS sin políticas). Va en la función de la agenda (`/api/agenda/milestones`): no hay sitio para una función nueva (12 de 12).
- **Tope:** 200 hitos por persona.

## Criterios de aceptación

1. Given la página de Deporte
   When se añade "Media maratón de Valencia", 2024, noviembre
   Then aparece en la lista como "Media maratón de Valencia · noviembre de 2024" y sigue ahí al recargar

2. Given un hito en Deporte
   When se abre la página de Aventura
   Then no aparece en los retos superados de Aventura

3. Given un hito
   When se pulsa su botón de borrar
   Then desaparece de la lista

4. Given un título vacío o de más de 80 caracteres, o un año futuro
   When se intenta guardar
   Then el servidor lo rechaza y no se guarda

5. Given una persona con hitos
   When exporta sus datos o borra su cuenta
   Then los hitos aparecen en la exportación, y se borran con la cuenta

6. Given la página de Categorías
   When se mira la tarjeta de Deporte
   Then enlaza a su página, ya no dice "Próximamente"
