# Guion del test de usabilidad — Ciclo 1 (MVP)

**Para quién:** la persona que dirige la sesión (el autor del TFM). Se puede imprimir o tener abierto en otra pantalla.
**Qué valida:** RN-04 (experiencia motivadora y no punitiva) y RES-07 (sin *dark patterns*) sobre el flujo completo, y RNF-01 (evaluar las categorías en menos de 2 minutos). Plan general en [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md) apartado 2.
**Participante:** una persona (n = 1), sin conocimientos técnicos del proyecto.
**Duración:** 45-60 minutos.
**Resultados:** se anotan en [02_Resultados_Test_Usabilidad.md](02_Resultados_Test_Usabilidad.md).
**Versión corta:** [03_Short_Test_Script_EN.md](03_Short_Test_Script_EN.md) — en inglés (la participante no habla español), unos 20 minutos, 5 tareas y 5 preguntas. Es la que se usa en la sesión real; esta versión completa queda como referencia metodológica para la memoria.

---

## 1. Qué se quiere averiguar (y qué no)

Preguntas de la sesión, por orden de importancia:

1. **¿Se siente juzgada o vigilada** en algún momento (colores, textos, marcas de "sin responder", recomendaciones)? (RN-04, RES-07)
2. ¿Entiende **qué es la entrevista** y la completa sin ayuda y en **menos de 2 minutos**? (RF-10, RNF-01)
3. ¿Entiende **para qué se le pide consentimiento** en las categorías sensibles? (RF-04)
4. ¿Sabe **leer su panel**: el radar de equilibrio y la evolución? (RF-14, RF-15, RF-16)
5. ¿Descubre la **recomendación** ("Una idea para ti") y le parece amable y útil? (RF-18)
6. ¿Encuentra cómo **descargar sus datos** y **borrar su cuenta**? (RF-05)

No se evalúa: el registro con correo real, la recuperación de contraseña ni el panel de administración.

## 2. Preparación (el día antes)

- [ ] **Versión fija.** Anotar el commit que se prueba (`git log -1 --oneline` en `develop`) en la hoja de resultados. No desplegar cambios durante la sesión.
- [ ] **Dónde se prueba.** El proyecto es *mobile-first*: lo ideal es el **móvil de la participante**. Opciones:
  - **URL de *preview* de Vercel** de `develop`. Las *previews* suelen estar protegidas con inicio de sesión de Vercel: o se desactiva la protección para *previews* (Vercel → *Settings → Deployment Protection*) mientras dure la prueba, o se usa el botón *Share* de la barra de Vercel para generar un enlace temporal que la salta. Volver a activarla al terminar.
  - **En local** (`npm run dev:full`) en el portátil: más sencillo, pero sin móvil.
- [ ] **Migraciones aplicadas** en Supabase: de la 0001 a la 0007 (sin la 0007 no aparece ninguna recomendación; sin la 0005, la entrevista no carga las categorías).
- [ ] **Variables de entorno de la *preview*** (si se usa Vercel): en *Settings → Environment Variables*, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` deben estar marcadas también para el entorno *Preview*; si no, el registro falla con un error 500.
- [ ] **Supabase activo.** Abrir el panel de Supabase y comprobar que el proyecto no está pausado (el *keep-alive* diario debería mantenerlo, pero se comprueba).
- [ ] **Ensayo completo** del recorrido con una cuenta propia de prueba, en el mismo dispositivo y URL que se usarán. Borrarla después.
- [ ] **Umbral de recomendaciones** en su valor por defecto (5): una categoría puntuada de 1 a 4 debe mostrar "Una idea para ti".
- [ ] Hoja de resultados abierta, cronómetro (el del móvil vale) y, si la participante lo acepta, grabación de pantalla.

## 3. Cómo dirigir la sesión

- **Pensar en voz alta:** pedirle que diga lo que piensa mientras usa la app ("estoy buscando…", "no sé qué significa esto…").
- **No ayudar.** Si pregunta "¿y ahora qué hago?", devolver la pregunta: "¿Qué harías tú?". Solo intervenir si lleva más de 2 minutos atascada en una tarea, y anotarlo como "con ayuda".
- **Leer las tareas tal cual.** Están redactadas sin usar las palabras de los botones, para no darle la solución.
- **Observar más que preguntar.** Lo que hace pesa más que lo que dice.
- **Sesgo de cercanía** (la participante conoce al autor y puede querer ser amable): decirlo abiertamente al empezar (ver el texto de bienvenida), pedirle explícitamente las críticas y, al final, preguntar "¿qué le dirías a una amiga antes de que la probara?", que suele sacar la opinión más honesta.
- **Datos personales:** puede inventarse las puntuaciones; no hace falta que sean reales. Todo se borra en la última tarea.

### Texto de bienvenida (leer)

> "Gracias por ayudarme. Vamos a probar una app para evaluar cómo te va en distintas áreas de tu vida. No te estoy evaluando a ti, sino a la app: si algo no se entiende, es culpa suya, no tuya. Me ayuda mucho más que me digas lo que no te gusta que lo que te gusta — de verdad, las críticas son lo más útil. Intenta decir en voz alta lo que piensas mientras la usas. No te voy a ayudar mucho, porque quiero ver cómo te las arreglarías tú sola. Puedes inventarte las respuestas: al final borraremos la cuenta. ¿Te parece bien que grabe la pantalla? (Opcional.)"

## 4. Tareas

Para cada una: leer el **escenario**, cronometrar si se indica, y anotar el resultado (✅ sin ayuda · 🟡 con ayuda · ❌ no completada), los errores y las frases literales que diga.

### T1 — Primer contacto y registro
> "Acabas de oír hablar de esta app. Entra y crea una cuenta para empezar."

- **Éxito:** crea la cuenta y llega a la bienvenida de primera vez, con el botón grande para empezar.
- **Observar:** ¿entiende qué hace la app al leer la portada? ¿Le transmite algo (calma, curiosidad, desconfianza)?
- **Preguntar al terminar:** "Con lo que has visto hasta ahora, ¿para qué crees que sirve esta app?"

### T2 — La primera entrevista ⏱️ (RNF-01)
> "Cuéntale a la app cómo te va ahora mismo en cinco áreas de tu vida que te importen. Una de ellas tiene que ser el deporte."

- **Cronometrar** desde que abre la entrevista hasta que guarda. **Objetivo: menos de 2 minutos** (RNF-01).
- **Éxito:** activa cinco categorías, entre ellas Deporte (sensible: aparece la ventana de consentimiento), las puntúa y guarda.
- **Observar:**
  - ¿Entiende la ventana de consentimiento? ¿Le preocupa o le tranquiliza? ¿Abre el enlace a la política?
  - ¿Descubre el icono de ejemplos junto a cada pregunta? ¿Lo usa?
  - ¿Le ayudan los accesos directos y la marca "Sin responder", o le generan presión?
  - ¿Duda con la escala 1-10?
- **Nota para quien dirige:** si puntúa todo con 5 o más, no aparecerá ninguna recomendación en T4. No decir nada aquí; en T5 se le pedirá bajar alguna.

### T3 — Leer el panel
> "Vuelve a la pantalla principal. Según la app, ¿cómo estás ahora mismo? ¿En qué área estás mejor y en cuál peor?"

- **Éxito:** identifica en el radar ("Tu equilibrio") o en las tarjetas el área más alta y la más baja.
- **Observar:** ¿entiende el radar sin explicación? ¿Mira los números o solo la forma? ¿Algo le suena a "nota" o a "suspenso"?
- **Preguntar:** "¿Cómo te hace sentir ver esto?" (RN-04)

### T4 — Una idea para mejorar
> "Mira si la app te propone algo para alguna de esas áreas."

- **Éxito:** encuentra y abre "Una idea para ti" en una categoría puntuada por debajo de 5.
- **Si no hay ninguna** (todo ≥ 5): anotarlo y pasar a T5; se repite esta tarea después.
- **Observar:** ¿el botón destacado le llama la atención? ¿La idea le parece amable, útil, obvia, paternalista? ¿Lee el aviso de que no es asesoramiento profesional?

### T5 — Ha pasado un mes ⏱️
> "Imagina que ha pasado un mes y algo ha cambiado. Actualiza cómo te va en un par de áreas." *(Si en T4 no había recomendación: "…y una de ellas ha ido peor".)*

- **Cronometrar** (actualizar debería ser más rápido que la primera vez).
- **Éxito:** vuelve a la entrevista (ahora "Actualiza tus respuestas"), cambia dos puntuaciones y guarda.
- **Observar:** ¿encuentra el acceso ("Actualizar mis respuestas")? ¿Entiende que no está "haciendo otra entrevista" sino actualizando? ¿Ve el historial de cambios (a la derecha en escritorio; al final de la página en móvil)?
- **Si en T4 no había recomendación**, repetir T4 ahora.

### T6 — Ver la evolución
> "¿Puedes ver cómo ha cambiado esa área desde la primera vez?"

- **Éxito:** encuentra la tarjeta de la categoría en "Tu evolución" y explica el cambio (dos puntos, antes y ahora).
- **Observar:** ¿usa el selector de periodo? ¿Entiende que todos los gráficos muestran los mismos meses?
- **Nota para quien dirige:** como las dos respuestas son del mismo día, en un eje por meses **caen en el mismo punto** y el gráfico no enseña el cambio a simple vista. Es esperable (en uso real se actualiza cada semanas). Observar si lo descubre por el tooltip, por "Ver datos" o por el historial de cambios de la entrevista, y anotar si le confunde: puede ser un hallazgo.

### T7 — Tus datos
> "Quieres guardar una copia de todo lo que la app sabe de ti. Hazlo."

- **Éxito:** en "Mi perfil" → "Privacidad y datos", descarga el archivo.
- **Observar:** ¿dónde lo busca primero? ¿Le da confianza que exista?

### T8 — Irse de la app
> "Ya no quieres usar la app y quieres que no quede nada tuyo. Hazlo."

- **Éxito:** elimina la cuenta (pide la contraseña) y vuelve a la portada. **Esta tarea además limpia la base de datos: comprobar que se completa.**
- **Observar:** ¿le parece claro que es irreversible? ¿Le molesta que pida la contraseña o le da seguridad?

## 5. Después de las tareas

### 5.1 Cuestionario SUS (System Usability Scale)

Escala de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Leerlas en orden, sin explicarlas.

1. Creo que me gustaría usar esta app con frecuencia.
2. He encontrado la app innecesariamente compleja.
3. He pensado que la app era fácil de usar.
4. Creo que necesitaría la ayuda de una persona con conocimientos técnicos para poder usar esta app.
5. He encontrado que las distintas funciones de la app estaban bien integradas.
6. He pensado que había demasiada incoherencia en la app.
7. Imagino que la mayoría de la gente aprendería a usar esta app muy rápidamente.
8. He encontrado la app muy difícil de usar.
9. Me he sentido muy seguro/a usando la app.
10. Necesité aprender muchas cosas antes de poder empezar a usar la app.

**Cálculo:** preguntas impares → (respuesta − 1); pares → (5 − respuesta); sumar y multiplicar por 2,5. Resultado de 0 a 100; en torno a 68 es la media de referencia. Con n = 1 es un **indicador**, no una medida estadística.

### 5.2 Preguntas sobre el tono (RN-04 / RES-07)

Misma escala de 1 a 5:

1. En ningún momento me he sentido juzgado/a por mis respuestas.
2. Me he sentido cómodo/a respondiendo con sinceridad, incluso en áreas en las que no estoy bien.
3. Los colores y los textos me han transmitido calma, no presión.
4. Las ideas que propone la app me han parecido amables y aplicables.
5. He entendido por qué se me pedía consentimiento para algunas categorías.
6. Volvería dentro de unas semanas a actualizar mis respuestas.

### 5.3 Preguntas abiertas

1. ¿Ha habido algún momento en el que te hayas sentido vigilada, evaluada o incómoda? ¿Cuál?
2. ¿Qué es lo primero que cambiarías?
3. ¿Qué esperabas que hiciera la app y no ha hecho?
4. ¿Qué le dirías a una amiga antes de que la probara?

## 6. Qué hacer con lo que salga

- Pasar las notas a la hoja de resultados **el mismo día**.
- Cada problema recibe una **gravedad** (escala de Nielsen): 0 no es un problema · 1 cosmético · 2 menor · 3 importante · 4 bloqueante.
- **Regla de decisión** (apetito fijo hasta el 31 oct.):
  - **3-4 → se arregla antes del cierre del Ciclo 1**, con su tarea en el tablero.
  - **2 → se arregla si hay tiempo**; si no, a "Decisiones y deuda".
  - **0-1 → se anota** como trabajo futuro.
  - Cualquier problema que toque **RN-04** (sentirse juzgada o vigilada) sube como mínimo a 3, sea cual sea su tamaño: es el requisito de mayor riesgo del proyecto.
- Lo que se corrija se **vuelve a comprobar** con la participante si es posible (una segunda sesión corta), y se anota en la hoja.

## Historial de cambios

- **v1.0 (26 sept. 2026)** — versión inicial para el test del MVP (Ciclo 1).
- **v1.1 (26 sept. 2026)** — enlace a la versión corta en inglés, que es la que se usa en la sesión.
