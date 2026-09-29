# Resultados del test de usabilidad — Ciclo 1 (MVP)

**Guion seguido:** versión corta en inglés, [03_Short_Test_Script_EN.md](03_Short_Test_Script_EN.md) (5 tareas, 5 preguntas; sin SUS). El guion completo ([01_Guion_Test_Usabilidad.md](01_Guion_Test_Usabilidad.md)) queda para sesiones futuras.
**Estado:** sesión realizada; problemas clasificados. El único de gravedad 3 (guía de primer uso) está corregido ([UX-01](../user-stories/UX-01-guia-primer-uso.md)).

> Notas anotadas por el autor durante y justo después de la sesión, en el propio guion corto. Aquí se pasan a limpio y se clasifican.

## 1. Datos de la sesión

| Campo | Valor |
|---|---|
| Fecha | 27 sept. 2026 |
| Versión probada | `develop`, tras fusionar la PR #9 (radar, categorías traducidas por id) |
| Dispositivo y navegador | no anotado |
| Idioma de la app | inglés (la participante no habla español) |
| Participante | P1 — adulta, sin perfil técnico, angloparlante |
| Relación con el autor | Pareja (sesgo de cercanía: ver guion apartado 3) |
| Grabación | No |
| Duración total | no anotada (≈ 20 min previstos) |

## 2. Tareas

| Tarea (guion corto) | Resultado | Tiempo | Observaciones |
|---|---|---|---|
| T1 — Crear cuenta y puntuar ~5 áreas (con Deporte, que pide consentimiento) | 🟡 con ayuda | no cronometrado | Al principio hubo que guiarla: no sabía por dónde empezar ni qué se esperaba de ella. |
| T2 — Leer el panel: cómo está, mejor y peor área | 🟡 con ayuda | — | Necesitó ayuda para interpretar el panel. |
| T3 — Encontrar y abrir "An idea for you" | ✅ | — | — |
| T4 — Actualizar dos áreas (una a la baja) y ver el cambio | ✅ | — | Vio la opción de añadir notas, pero no quedó claro para qué sirve (ver sugerencias). |
| T5 — Eliminar la cuenta | ⏭️ no intentada | — | No es un fallo: la participante prefirió no borrar su cuenta porque quiere seguir usando la app. El autor lo comprobó después con su propia cuenta (sin rol admin) y funcionó. |

**RNF-01 (puntuar en < 2 min):** no cronometrado. Según el autor, la parte de puntuar no se alargó; lo que más tiempo llevó fue la conversación sobre sugerencias al final. **No se da el objetivo por medido**: queda como pendiente para una sesión con cronómetro.

## 3. Cuestionarios

### SUS

No aplicado (versión corta).

### Tono (RN-04 / RES-07) y uso

| Afirmación (guion corto) | Respuesta (1-5) |
|---|---|
| La app fue fácil de usar | 3 |
| No me sentí juzgada por mis respuestas | 4 |
| Me sentí cómoda respondiendo con sinceridad, también en las áreas que no van bien | 4 |
| Las ideas sugeridas me parecieron amables y útiles | 4 |
| Volvería en unas semanas a actualizar mis respuestas | 5 |

> La participante contestó primero "Yes" a todas; el autor pasó las respuestas a la escala 1-5 a partir de lo que ella le explicó después. Ver Limitaciones.

### Respuestas abiertas

1. **¿Algún momento incómoda, vigilada o juzgada?** — "No".
2. **¿Qué cambiaría primero / qué le diría a una amiga?** — *"Consider the app as something that you can trust to share a part of you to not to be judged but to be guided in the areas of your life that you think you are weak."*

### Sugerencias escritas por la participante (resumen)

1. Tras crear la cuenta, una sección de datos personales: fecha de nacimiento, peso, altura, género, aficiones, salud o necesidades especiales, religión, estado civil, hijos y sus edades, ubicación…
2. Una "calculadora" que muestre lo bien o mal que está cada categoría y, si está baja, frases inspiradoras o sugerencias para mejorar.
3. Bajo cada categoría, una pregunta abierta para contar detalles (p. ej. "¿Cuál es la mejor aventura que has vivido?").
4. Con esos detalles, sugerencias más personalizadas para cada usuario.

## 4. Problemas encontrados

Gravedad (Nielsen): 0 no es un problema · 1 cosmético · 2 menor · 3 importante · 4 bloqueante. Todo lo que afecte a RN-04 cuenta como 3 o más.

| # | Tarea | Problema (qué pasó) | Gravedad | ¿Toca RN-04? | Decisión | Tablero |
|---|---|---|---|---|---|---|
| 1 | T1, T2 | Sin ayuda no sabe por dónde empezar ni cómo leer el panel; "fácil de usar" = 3/5. Falta una guía de primer uso. | 3 | No | Corregido en el Ciclo 1 | Hecho: [UX-01](../user-stories/UX-01-guia-primer-uso.md) |
| 2 | T5 | No borró la cuenta, pero por decisión propia (quiere seguir usándola), no por un problema de la app. Comprobado aparte por el autor. | 0 | No | Nada que corregir | — |
| 3 | — | Pide una "calculadora" y sugerencias cuando un área está baja: ya existen (bandas de color, radar, "An idea for you"), así que **no destacan lo suficiente**. | 2 | No | Corregido en el Ciclo 1 | Hecho: [UX-02](../user-stories/UX-02-destacar-propuestas.md) |
| 4 | T4 | Vio las notas pero no entendió para qué sirven; propone una pregunta abierta por categoría. | 2 | No | Ciclo 2 (importante) | Ideas del Ciclo 2 |
| 5 | — | Sugerencias 1 y 4 (perfil ampliado, sugerencias personalizadas): funcionalidad nueva, no un problema de uso. | 0 | No | Ciclo 2 (importante) | Ideas del Ciclo 2 |

## 5. Conclusiones

- **RN-04 / RES-07: se cumple según lo declarado.** No se sintió juzgada (4/5, y "No" en la pregunta abierta), respondió con sinceridad (4/5) y la frase de la amiga describe casi literalmente el objetivo del producto: confiar sin sentirse juzgada, y recibir guía. Sin observación directa de incomodidad.
- **RNF-01:** no medido en esta sesión (ver apartado 2).
- **Lo que mejor ha funcionado:** el tono, las ideas (T3 sin ayuda, 4/5) y la intención de volver (5/5).
- **Lo que más urge cambiar:** el primer contacto (T1-T2 con ayuda); corregido con UX-01.
- **RF-05 (eliminar cuenta):** sin evidencia de esta sesión (T5 no se intentó); verificado por el autor con una cuenta sin rol admin, y cubierto por sus tests automáticos.

## 6. Limitaciones

- **n = 1**, frente a las 5 personas que recomienda Nielsen para encontrar la mayoría de problemas de usabilidad: sirve para detectar problemas graves, no para medir.
- **Sesgo de cercanía:** la participante es la pareja del autor, que además dirige la sesión. Mitigado pidiendo críticas explícitamente y dando más peso a lo observado que a lo declarado.
- **Escala reconstruida:** las respuestas 1-5 no las marcó la participante; las asignó el autor a partir de sus explicaciones. Suma un segundo sesgo al de cercanía.
- **Notas escuetas:** las tareas se anotaron solo con el resultado; faltan frases literales y el motivo de T5. Sin cronómetro.
- Datos inventados por la participante: se pierde la carga emocional de puntuar su vida real, que es precisamente la de mayor riesgo para RN-04.
- Participante no nativa en español probando en inglés: valida también la traducción (RNF-10), pero cualquier matiz de tono se juzgó en la versión inglesa.

## Historial de cambios

- **v1.0 (26 sept. 2026)** — plantilla vacía, preparada antes de la sesión.
- **v1.1 (27 sept. 2026)** — sesión realizada con la versión corta en inglés; plantilla adaptada a sus 5 tareas y 5 preguntas, problemas clasificados y enviados al tablero.
- **v1.2 (27 sept. 2026)** — T5 aclarada (no intentada por decisión de la participante; gravedad 0). Problema 1 corregido con UX-01.
- **v1.3 (27 sept. 2026)** — problema 3 corregido con UX-02.
