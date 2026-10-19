# Historia: Situaciones que lo ponen difícil (RF-42)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)), con un apartado de reglas porque el filtrado toca tres sitios.
**Referencias:** RF-42 (Should, Ciclo 2), RF-18 (recomendaciones), RF-40 (ideas con IA), RF-41 (qué te ayuda), RD-09 (catálogo curado), RES-09 (sin texto libre a la IA), RN-04 (tono), [02_Requisitos_Fase1.md](../requirements-analysis/02_Requisitos_Fase1.md) (v0.12), decisiones del autor del 29 sept. y del 3 oct.

Como usuario con una categoría baja
Quiero decir qué situaciones me lo ponen difícil
Para que la app no me proponga ideas que no puedo o no quiero hacer (si me cuesta salir de casa, que no me proponga un paseo)

## Alcance

- **"¿Qué te lo pone difícil?"**, bajo la pregunta de una categoría, plegado como "¿Qué te ayuda?" (RF-41). Aparece cuando la puntuación que se ve está por debajo de 5 (el umbral por defecto de RF-18) o la categoría tiene una idea abierta. Se marca y desmarca al momento (optimista, se deshace si el servidor falla). Si la puntuación vuelve a subir, la pregunta se oculta, pero lo marcado se conserva y sigue filtrando.
- **Lista cerrada de situaciones, nunca rasgos ni salud.** Es una lista general, pero en cada categoría solo se ofrecen las que chocan con alguna de sus ideas (las demás no cambiarían nada). Así, por ejemplo, Economía no pregunta por "Sitios con mucha gente".
- **Qué se filtra:**
  - El carrusel de ideas (UX-05) no enseña las ideas que chocan con lo marcado en su categoría, tampoco la recomendada. Si chocan todas, enseña las generales que no choquen.
  - Una recomendación nueva (RF-18) se elige entre las ideas que no chocan.
  - La personalización (RF-40) rechaza una idea que choque. **Las situaciones no se envían a la IA:** se filtra antes (minimización de datos).
- **Reacción al marcar** (también en "¿Qué te ayuda?" de RF-41). Lo marcado se guarda solo, así que "Guardar" no se activa: crearía una evaluación nueva sin que cambie la puntuación (RF-12). En su lugar, la reacción dice qué cambia de verdad:
  - Un "✓" con un texto corto según lo que cambia, cuando el servidor lo confirma: "Ideas actualizadas" (una situación, con idea abierta), "Lo tendrán en cuenta" ("¿Qué te ayuda?" con RF-40 activado e idea abierta), "Para tus próximas ideas" (sin idea abierta) o "Guardado" ("¿Qué te ayuda?" sin RF-40: no cambia nada visible y no se promete). Se borra solo a los pocos segundos y se anuncia al lector de pantalla. Va en la misma línea que el título de su lista, para que al irse no salte nada: a su derecha en pantallas anchas y, en móvil, donde no cabe, dentro del propio título un momento (que conserva su nombre para el lector).
  - "Ideas para Economía (3)": el botón dice cuántas ideas quedan y, al marcar cualquier opción de las dos listas con una idea abierta, da un pulso suave una sola vez (menos de un segundo, sin pulso con "reducir movimiento"). Nunca parpadeo continuo (RES-07, accesibilidad).
  - Los tres títulos de cada pregunta ("¿Qué te ayuda?", "¿Qué te lo pone difícil?", "Tu experiencia (privada)") llevan icono y una flecha que gira, con fondo suave, para que se vea que se despliegan. "Tu experiencia" se cierra con su título (lo escrito se conserva) o con la X del campo, que lo borra y vuelve al principio.
- **Datos:** en la copia de la categoría de cada usuario, como las opciones de RF-41 (migración 0013). Entran en la exportación (RF-05) y se borran con la categoría.
- **El contenido es curado (RD-09) y lo revisa el autor:** la lista de situaciones y qué idea choca con cuál, en el apartado de reglas. Redactado con ayuda de IA; pendiente de su revisión, como las ideas nuevas de RF-40a.
- **Fuera de alcance:** situaciones escritas por el usuario (nunca: texto libre), situaciones para la IA y editarlas desde `/admin` (idea ADM-04).

## Reglas

**Situaciones** (clave · texto en español; las claves y su orden, en `situations.json` desde CAT-01):

| Clave | Texto |
|---|---|
| `salirDeCasa` | Salir de casa |
| `sitiosConGente` | Sitios con mucha gente |
| `darElPrimerPaso` | Dar el primer paso con otras personas |
| `actividadesEnGrupo` | Actividades en grupo |
| `hablarDeLoQueSiento` | Hablar de lo que siento o me preocupa |
| `llamarPorTelefono` | Llamar por teléfono |
| `contactoConFamilia` | Estar en contacto con mi familia |
| `apuntarYRegistrar` | Apuntar cosas o llevar registros |
| `mirarMisCuentas` | Mirar mis cuentas |
| `cambiosDeRutina` | Cambiar mi rutina |
| `pocoTiempoLibre` | Tener poco tiempo libre |

**Ideas que chocan con cada situación:** desde CAT-01 viven como datos en [`situations.json`](../../src/modules/recommendations/domain/catalog/situations.json) (`clashesWith` de cada situación), la única fuente; los tests del catálogo comprueban que cada choque apunta a una idea que existe. Para revisarlos o cambiarlos, se edita ese archivo.

**Ideas permitidas** para una categoría y lo marcado en ella: sus ideas menos las que chocan; si no queda ninguna, las generales menos las que chocan. Las ofrecidas en una categoría son las situaciones de la tabla que tocan alguna de sus ideas (las de una categoría sin ideas propias, las que tocan las generales), en el orden de la tabla.

## Criterios de aceptación

1. Given una categoría con puntuación 3
   When el usuario mira su pregunta
   Then ve "¿Qué te lo pone difícil?", plegado, con las situaciones de esa categoría

2. Given una categoría con puntuación 8 y sin idea abierta
   When la mira
   Then no ve "¿Qué te lo pone difícil?"

3. Given marca "Apuntar cosas o llevar registros" en Economía
   When abre sus ideas
   Then el carrusel no enseña las que chocan (economia.1, economia.4): "Idea 1 de 3"

4. Given una situación marcada
   When se guarda una puntuación baja que abre una recomendación
   Then su idea es una de las que no chocan

5. Given una situación marcada
   When se pide personalizar una idea que choca
   Then el servidor lo rechaza

6. Given una opción que no es de esa categoría
   When se intenta guardar
   Then el servidor lo rechaza

7. Given situaciones marcadas
   When exporta sus datos (RF-05)
   Then salen en la exportación

8. Given una categoría con idea abierta
   When marca una situación y el servidor lo confirma
   Then ve "✓ Guardado · tus ideas se han actualizado", y "Ideas para Economía" dice cuántas quedan y da un pulso

9. Given RF-40 sin activar
   When marca una opción de "¿Qué te ayuda?"
   Then ve solo "✓ Guardado", sin pulso en las ideas
