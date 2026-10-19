# Historia: Entrevista personal — elegir categorías y puntuarlas, siempre editable

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-10, RD-03, RNF-01, RN-01, RN-04, [06_Diagrama_Secuencia_CheckIn.md](../requirements-analysis/06_Diagrama_Secuencia_CheckIn.md)

> **Nombre:** los requisitos lo llaman *check-in*; en la interfaz se presenta como **"Entrevista"** (una charla tranquila con un entrevistador, no un trámite de hotel). El código del dominio sigue hablando de `Assessment`; solo la capa de presentación usa "entrevista".

Como usuario con categorías activas
Quiero elegir qué categorías sigo y puntuar cómo voy en ellas (1-10), y poder cambiarlo cuando quiera
Para tener un registro honesto de mi vida, sin juicios y a mi ritmo

## Alcance

- **RF-10** (Must): puntuar categorías activas en una escala 1-10. Una *entrevista* es el conjunto de puntuaciones que el usuario envía de una vez; cada puntuación es una `Assessment` (RD-03: usuario, categoría, puntuación, fecha, nota opcional).
- **Siempre editable, sin "entrevistas nuevas":** la pantalla muestra el estado actual — categorías marcadas (= activas) con su **última puntuación precargada** — y el usuario cambia lo que quiera. **Cambiar una puntuación inserta una evaluación nueva; nunca se sobrescribe la anterior** (RF-12 sigue intacto y el histórico alimentará RF-14). Solo se envía lo que cambió.
- **Puntuar es opcional por categoría.** Casilla **"Seleccionar todas"** (estado intermedio si es parcial) para activar todas las no sensibles de golpe.
- **Resultados** (`/perfil/resultados`, y el Home para usuarios recurrentes): última puntuación de cada categoría activa, con fondo suave por banda (bajo 1-3, casi bajo 4-5, medio 6-7, bueno 8-10). Es un **precursor mínimo de RF-14** (panel/visualización), no lo sustituye: sin histórico ni gráficos.
- **Colores suaves y siempre con número y texto** (RN-04: el sistema no juzga; accesibilidad: el color nunca es la única señal).
- **Ubicación:** dentro de "Mi perfil", en un menú lateral (cajón fijo en md+, desplegable en móvil) junto a Perfil y Resultados, que sustituye a las pestañas. Rutas `/perfil/entrevista` y `/perfil/resultados`.
- **Categorías dentro de la entrevista** (RF-06/RF-07): sin página aparte. Se listan **todas** para tener una vista general; **marcar** una la activa (las sensibles piden consentimiento en un modal, RF-04) y **desmarcarla** la desactiva — es la interfaz de desactivación que faltaba. Las evaluaciones ya guardadas de una categoría desactivada se conservan. "Seleccionar todas" solo activa las no sensibles: el consentimiento es por categoría.
- **Dos columnas y aside de historial:** a la izquierda las categorías sin consentimiento (con "Seleccionar todas", que solo actúa sobre ellas); a la derecha las que requieren consentimiento, con una explicación breve — se marcan una a una. En un aside a la derecha, el **historial de cambios** del usuario: cada guardado con su fecha y, por categoría, "antes → ahora" (`GetAssessmentHistory`, `GET /api/assessments/history`). Es una lista, no la evolución gráfica (RF-14). El diseño móvil de estas dos zonas se afina después (se apilan por ahora).
- **Primera vez vs. actualizar:** la pantalla es la misma, pero sin respuestas guardadas se presenta como "Tu entrevista" y, con alguna guardada, como "Actualiza tus respuestas" (con otro texto del entrevistador). En Inicio y Resultados el acceso es "Actualizar mis respuestas", no "Nueva entrevista": no se hacen entrevistas nuevas, se actualiza la existente.
- **Categorías sin responder:** cada categoría activa sin puntuación guardada ni elegida lleva una etiqueta "Sin responder" junto a su pregunta y un borde lateral suave (lila, no de alarma: RN-04). Encima de las preguntas hay una fila de accesos directos, uno por categoría activa (los pendientes destacados), que llevan a su pregunta (`#pregunta-<id>`, desplazamiento suave salvo `prefers-reduced-motion`).
- **Ayuda por pregunta:** un icono "i" junto a cada pregunta despliega ejemplos para ayudar a pensar (p. ej. Economía: salario, ahorro, deudas). Se eligió un desplegable en línea frente a modal o panel lateral: no tapa la pregunta, funciona igual en móvil y escritorio y permite abrir varios a la vez.
- **Color:** el número y los botones no se colorean; solo la respuesta recibe un fondo **plano** y suave por banda (rojo/naranja/amarillo/verde claros, sin degradados), con transición de color y respeto a `prefers-reduced-motion`. En resultados, igual: número neutro, texto de la banda y fondo suave.
- **Aspecto:** conversación con avatares por defecto (SVG propios; el catálogo real llega con RF-26), paleta suave y mucho aire.
- **Nota opcional** (RD-03; RF-11 es Should): el modelo, el caso de uso y la pantalla ya la admiten; longitud máx. 500.
- **Registro inmutable** (RF-12, Should): solo se insertan evaluaciones; la ventana de corrección de 24 h **no** se implementa todavía.
- **Sin periodos ni frecuencia** (RF-09, Should) ni **recomendaciones** (RF-18, lo siguiente del tablero).
- **Persistencia real desde el principio** (Supabase, `supabase/migrations/0004_assessments.sql`) — ver [04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md) apartado 5.1.

## Criterios de aceptación

1. Given un usuario con categorías activas
   When guarda puntuaciones 1-10 nuevas o cambiadas
   Then se guardan tantas evaluaciones como puntuaciones, todas con el mismo momento de registro y sin modificar las anteriores

2. Given una puntuación fuera de 1-10, no entera o ausente
   When se envía
   Then se rechaza entera con un error de validación, sin guardar ninguna (todo o nada)

3. Given una categoría inactiva, inexistente o ajena
   When se intenta puntuar
   Then se rechaza entera: inactiva → conflicto; inexistente/ajena → no encontrada

4. Given la misma categoría dos veces en una entrevista
   When se envía
   Then se rechaza por duplicada

5. Given una nota con más de 500 caracteres
   When se envía
   Then se rechaza; una nota vacía o solo espacios se guarda como "sin nota"

6. Given una categoría inactiva
   When el usuario la elige en la entrevista
   Then se activa y queda elegida; si es sensible, antes ve el modal de consentimiento (con enlace a la política) y, si cancela, queda sin elegir

7. Given un usuario que ya puntuó antes
   When vuelve a la pantalla
   Then ve sus categorías marcadas y su última puntuación precargada; el "Guardar" de cada categoría está deshabilitado hasta que la cambie, y al guardar solo se envía esa (UX-05; antes, un "Guardar cambios" único que enviaba las cambiadas) (nuevos registros; los anteriores se conservan)

8. Given la casilla de una categoría
   When el usuario la desmarca (o marca)
   Then se desactiva (o activa) en el momento; las sensibles aparecen en una columna aparte con su explicación, y "Seleccionar todas" activa/desactiva en bloque solo las no sensibles, con estado intermedio si es parcial

8b. Given un usuario con varios guardados
   When abre la entrevista
   Then ve a la derecha el historial de cambios, del más reciente al más antiguo, con "antes → ahora" por categoría

8c. Given categorías activas sin responder
   When el usuario abre la entrevista
   Then cada una aparece marcada como "Sin responder" en su pregunta y en su acceso directo, y la marca desaparece en cuanto elige una puntuación; el acceso directo lleva a esa pregunta

8d. Given un usuario con respuestas guardadas
   When abre la entrevista
   Then la pantalla se presenta como "Actualiza tus respuestas", no como una entrevista nueva

9. Given una pregunta de categoría
   When el usuario pulsa el icono de ejemplos
   Then se despliega (o se oculta) una lista de ejemplos para ayudarle a pensar

10. Given un usuario con puntuaciones guardadas
   When abre los resultados
   Then ve la última puntuación de cada categoría con fondo suave de banda, el número y el texto de la banda; las categorías sin puntuar salen como "Sin puntuar todavía"

## Notas de diseño

- **Todo o nada:** `RecordAssessments` valida todo primero y solo entonces guarda con `saveMany`; un guardado es una sola acción del usuario y no debe quedar a medias.
- **Editar = insertar:** se descartó actualizar filas para no romper RF-12 ni perder el histórico que RF-14 necesitará (gráficos de evolución).
- **Diez botones, no slider:** un slider siempre tiene un valor por defecto (un 5 preseleccionado sesgaría los datos) y no permite "todavía sin puntuar".
- **Última puntuación:** `GetLatestScores` la calcula en el caso de uso (no en SQL) para que el dominio no dependa de la base de datos.
