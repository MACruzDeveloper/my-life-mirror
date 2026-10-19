# Guion de la demo de cierre — MVP y Ciclo 2

**Para qué:** enseñar el MVP terminado al tutor (y, si es posible, a 2-3 personas no técnicas), como pide la técnica de validación "Demos frecuentes" del [plan de V&V](../requirements-analysis/04_Plan_Verificacion_Validacion.md), apartado 2. Es también el hito de la **primera entrega a producción** (`main`).
**Cuándo:** al final del proyecto, para la revisión de los profesores (decidido el 29 sept.: solo revisan el proyecto terminado). La primera entrega a producción (apartado 1.1) se hace ya, sin esperar a la demo.
**Duración:** unos 35 minutos en vivo (30 de demo + preguntas); el vídeo de la entrega, 10-15 minutos (apartado 0).
**También sirve como guion de la prueba exploratoria** antes de la entrega ("Revisión antes de la entrega" en el tablero): recorrer el apartado 2.2 en producción, en móvil y en escritorio, anotando lo que falle.
**Idea que tiene que quedar:** una app de bienestar que no juzga (RN-04), construida con disciplina de ingeniería (Clean Architecture, TDD, controles automáticos) y validada con una persona real, sin esconder sus límites.
**Material:** la [presentación](https://claude.ai/artifact/HiVp8AhXmQk9i75Dt2Z15B) (19 diapositivas, con notas del orador que sirven de base para el vídeo) y la cuenta de prueba de producción, con rol de administración ([TFM-01](../user-stories/TFM-01-cuenta-de-prueba.md)).

---

## 0. Cómo se entrega: presentación, vídeo y demo (propuesta, a concretar con el autor)

Las tres piezas cuentan lo mismo a tres ritmos, y no se repiten enteras:

| Pieza | Para quién y cuándo | Qué lleva | Duración |
|---|---|---|---|
| **Presentación** | Se entrega junto al TFM; el profesor la lee a su ritmo | Las 19 diapositivas: producto, análisis y decisiones, construcción y TDD, IA, garantías y límites. Las notas del orador explican cada una | — |
| **Vídeo** | Se entrega junto al TFM; lo ve antes de probar la app | 1) Presentación resumida, unas 9 diapositivas clave (3-4 min). 2) La app en producción con la cuenta de prueba, siguiendo el apartado 2.2 (6-8 min). 3) Cómo está construida: un test E2E en `--ui` y los controles de una PR (2-3 min). 4) Cierre: límites y cómo probarla (1 min) | 10-15 min |
| **Demo en vivo** | Solo si hay defensa o reunión | El apartado 2 completo, con preguntas | ~35 min |

**Diapositivas para el vídeo** (de la presentación completa): portada (1), la idea (2), qué se puede hacer (5), las decisiones del principio (8), TDD (10), la IA dentro de la app (11), medido con el modelo real (12), calidad (15) y cierre (19). El resto queda para quien lea la presentación.

**Cómo grabarlo:** QuickTime (Archivo → Nueva grabación de pantalla) o la grabación de pantalla de macOS (Mayús + Cmd + 5), con el micrófono. Primero la presentación en pantalla completa, después el navegador. Una toma por bloque es más fácil de repetir que una sola larga.

## 1. Antes de la demo

### 1.1 Primera entrega a producción (una vez)

*Hecho el 29 sept. (v1.0.0); se conserva como registro.*

1. **Vercel → Settings → Environment Variables** (Production y Preview): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL` (la URL de producción) y, opcional, `RECOMMENDATION_THRESHOLD`. Sin ellas, las funciones de `api/` responden 500 ("Faltan SUPABASE_URL…").
2. **Supabase → Authentication → URL Configuration:** *Site URL* = la URL de producción; en *Redirect URLs*, `<URL de producción>/restablecer-password`.
3. **Datos:** producción y *previews* comparten el mismo proyecto de Supabase. Borrar las cuentas de prueba del desarrollo y crear la cuenta de administrador (SQL del [README](../../README.md), "Probar como administrador").
4. **Versión:** cerrar "[Sin publicar]" del CHANGELOG como versión y etiquetarla (propuesta: `1.0.0`, fin del `0.x` según AGENTS.md).
5. **PR `develop` → `main`** con los controles en verde (Vercel y "E2E con api"). Vercel despliega producción.
6. **Comprobación en la URL real:** registrarse, entrevista, Inicio, cerrar sesión, volver a entrar y eliminar esa cuenta.
7. **GitHub → Settings → Default branch:** volver a `main` (el *keep-alive* de Supabase se ejecuta desde la rama por defecto).

### 1.2 Antes de grabar el vídeo o de la demo (30 minutos antes)

- [ ] Producción carga y *Smoke producción* está en verde en la última versión (v1.4.1 o posterior).
- [ ] **Cuenta de prueba restaurada** con `npm run demo:reset -- --yes`, con la contraseña privada en `DEMO_USER_PASSWORD`: un año de historial, tres ideas abiertas, diario, la IA activada y **rol de administración**. Una sola cuenta enseña todo, también el panel.
- [ ] "Otra persona" la crea el mismo script: sus experiencias compartidas salen en la pestaña "De otras personas".
- [ ] La IA funciona en producción (RF-40b, desde el 14 oct.): abrir una idea y ver la pestaña "Con IA" antes de grabar.
- [ ] Un **email nuevo** para registrarse en directo (p. ej. `demo+1@example.com`).
- [ ] Docker Desktop abierto y `npm run test:e2e:api` ejecutado una vez antes, para el modo `--ui` de Playwright.
- [ ] Las herramientas de desarrollo del navegador en **modo móvil** a mano.
- [ ] Pestañas abiertas: la app, GitHub (una PR con sus *checks*), la presentación, este guion.
- [ ] Notificaciones del ordenador silenciadas.
- [ ] **Plan B** si falla la red o producción: `npm run dev:local` (la misma app contra el Supabase local; `npm run demo:reset -- --local` siembra la cuenta) y los vídeos de los tests (`E2E_VIDEO=1 npm run test:e2e:api`, en `test-results/`).

---

## 2. La demo

### 2.1 El problema (2 min)

- Evaluar cómo va tu vida por áreas suele sentirse como un examen. La app quiere ser **un espejo honesto, no un examen**: sin juicios, sin comparaciones con nadie (RN-04, RN-09 fuera de alcance).
- Qué hace el MVP: eliges áreas, te puntúas del 1 al 10, ves tu equilibrio y tu evolución, y recibes ideas concretas y amables para lo que tú decidas mejorar.

### 2.2 La app, como la usaría alguien nuevo (12 min; en el vídeo, 6-8)

| Paso | Qué enseñar | Qué decir |
|---|---|---|
| Portada | La imagen, "Escuchar la presentación" (unos segundos) y el idioma | La voz y la imagen están generadas con IA por el autor, y la página lo dice. Inglés desde antes de tener cuenta. |
| Registro | Crear cuenta con el email nuevo; probar antes una contraseña débil | El formulario explica qué falta; el inicio de sesión nunca dice por qué falla (SEC-01). |
| Entrevista | Marcar 3-4 áreas y **Espiritualidad** (pide consentimiento); puntuar, "Guardar todo" | Las categorías sensibles piden consentimiento explícito y versionado (RF-04). Se puede puntuar solo una parte. |
| ¿Qué te ayuda? / ¿Qué te lo pone difícil? | Con una puntuación baja, marcar una situación: las ideas que chocan desaparecen | Listas cerradas, sin texto libre (RF-41, RF-42). |
| *Cambiar a la cuenta de prueba* | Cerrar sesión y entrar con `demo@example.com` | Trae un año de historial para que los gráficos tengan algo que enseñar. |
| Inicio | Ideas para ti, **Tu equilibrio** (radar) y **Tu evolución** | El color nunca es la única señal: número y texto siempre. |
| Ventana de ideas | "Ideas para Finanzas": pestañas "De la app", "Con IA" y "De otras personas"; guardar una con fecha | La IA reescribe ideas del catálogo con un revisor; si falla, la original (RF-40). Lo de otras personas, anónimo y con filtros (RF-43). |
| Diario e IA | En Aventura, "Sugerir opciones con IA" en la experiencia del diario | Solo propone claves de listas cerradas; la persona acepta o no (RF-45). |
| Resultados y calendario | *Mi perfil → Resultados* (barras) y *Calendario* (la idea con fecha) | |
| Páginas de categoría | *Categorías → Aventura*: añadir un viaje al mapa; *Deporte*: un hito y los vídeos | Imágenes de cabecera generadas con IA, sin marcas; los vídeos los gestiona la administración por idioma (ADM-04). |
| Compartir | En Familia (un 8), "Compartir de forma anónima" | Altruista, una a una, con vista previa y filtros; nunca en categorías sensibles. |
| Ayuda | "¿Necesitas ayuda ahora?" | Ayuda para todos, sin detectar nada (RES-09). |
| Móvil | Modo móvil: menú, entrevista con el avatar encima de cada burbuja | Diseñada primero para móvil (RNF-06). |
| Privacidad | *Mi perfil → Privacidad y datos*: descargar mis datos | Exportar y borrar la cuenta (RF-05). La de prueba no se puede borrar: es compartida. |
| Administración | Con la misma cuenta: usuarios, categorías en dos idiomas, **vídeos**, auditoría | Retirar sin borrar; las traducciones por id, así que un idioma nuevo no cambia el esquema. Las acciones quedan auditadas. |

### 2.3 Cómo está construida (8 min; en el vídeo, 2-3)

1. **Arquitectura:** monolito modular con Clean Architecture en cada módulo (dominio / aplicación / infraestructura), 12 funciones serverless en Vercel (el límite del plan gratuito) y Supabase ([ADR-03](../architecture-decisions/03_Arquitectura_Software.md)).
2. **Especificación antes que código:** una historia Nivel 2 (Given/When/Then) por funcionalidad, 54 en total; enseñar una, p. ej. [UX-14](../user-stories/UX-14-aviso-ante-errores.md), corta y reciente.
3. **TDD y controles automáticos** ([plan de V&V](../requirements-analysis/04_Plan_Verificacion_Validacion.md), apartados 1.3 a 1.5):
   - 1060 tests (Vitest), con cobertura por niveles: lo crítico (contraseñas, sesión, consentimiento, borrado de datos, filtros de la IA) al 100 % de líneas.
   - Husky: lint y tipos al hacer commit; el control completo (`npm run verify`) antes de cada `push`.
   - `check:api`: compila y **carga** cada función como lo hace Vercel.
   - Lighthouse: el salto de la página al cargar, de 1,04 a menos de 0,1.
4. **E2E de verdad, sin tocar datos reales:** `npm run test:e2e:api -- --ui`. Un Supabase local en Docker, 42 recorridos en móvil y escritorio. Enseñar el "viaje en el tiempo" de un test (el del consentimiento es el más visual).
5. **En cada entrega:** la pestaña *Checks* de la PR a `main`, con "E2E con api" en verde.

### 2.4 Validación y métricas (5 min)

- **Pruebas de usabilidad** ([resultados](02_Resultados_Test_Usabilidad.md)): una participante, dos sesiones (27 sept. y 12 oct.). No se sintió juzgada (4/5) y volvería (5/5). Su frase: *"something you can trust to share a part of you, not to be judged but to be guided"*. De ahí salieron la guía de primer uso (UX-01), destacar las ideas (UX-02) y el recordatorio amable (UX-10).
- **Métricas DORA y Flow** ([resultados](../project-management/02_Metricas_DORA_y_Flujo.md), apartado 7): ocho versiones en producción en tres semanas. La v1.4.0 la paró dos veces el E2E antes de producción, una por un fallo real (un navegador con zona horaria "UTC" no podía guardar el perfil); 47 minutos desde el primer fallo hasta producción en verde, y ningún fallo en producción (apartado 7.8).
- **IA medida con el modelo real** ([ADR-05](../architecture-decisions/05_Fundamentos_IA.md)): 17 de 20 ideas llegan al usuario, 26 de 26 borradores malos frenados, 5 de 5 inyecciones resistidas.
- **Límites, dichos en voz alta:** n = 1 y participante cercana; métricas de una sola persona, no comparables con las bandas de DORA.

### 2.5 Lo que viene (2 min)

- **Hecho**, además del MVP: el Ciclo 2 que salió de la validación (IA anclada al catálogo, listas cerradas, diario, compartir, líneas de ayuda) y la fase de mejoras (avatares, páginas de categoría, calendario, avisos, administración de vídeos, presentación en audio, calidad).
- **Lo que falta, si pasara a producto:** validar con más personas y las decisiones éticas con un profesional; ideas y listas editables desde la administración; cargar cada pantalla por separado; segundo factor y verificación del email. La deuda técnica está en el [tablero](../project-management/01_Backlog_MVP.md).
- **Dilemas éticos para comentar:** texto libre hacia la IA con salvaguardas (RF-45, [ADR-05](../architecture-decisions/05_Fundamentos_IA.md), apartado 4.4) y texto de un usuario que leen otros, sin moderador (RF-43).
- La línea que no se cruza: nada de detección algorítmica de riesgo clínico (RES-09).

---

## 3. Preguntas probables

| Pregunta | Respuesta corta | Dónde está |
|---|---|---|
| ¿Por qué no un LLM que escriba las recomendaciones? | Riesgo de lenguaje diagnóstico o de consejo profesional. La IA solo reescribe ideas del catálogo, con verificación automática y caída al texto curado (RF-40), o propone opciones de listas cerradas (RF-45). | ADR-05, apartados 4.3 y 4.4 |
| ¿Cómo protegéis a quien lee lo que comparten otros, sin moderador? | Filtros antes de publicar (contacto, salud y dinero, insultos), vista previa, solo el texto (sin nombre ni fecha), un reporte lo oculta al momento y el aviso de que no es consejo profesional. | Historia RF-43 |
| ¿Detecta la app si alguien está mal? | No, a propósito (RES-09): nada valora a la persona por lo que escribe. En su lugar, la ayuda está siempre a la vista, igual para todos (RF-30). | RES-09, RF-30 |
| ¿Por qué Clean Architecture en un MVP? | Decisión consciente: el objetivo del TFM incluye aplicar la arquitectura, y permite probar la lógica sin base de datos (Fakes). | ADR-03, apartado 5 |
| ¿Qué pasa con los datos sensibles? | Consentimiento explícito y versionado por categoría, RLS activado, *service role key* solo en el servidor, exportación y borrado completos. | RF-04, RF-05, ADR-04 |
| ¿Cómo sabéis que funciona en producción y no solo en local? | `check:api` carga las funciones como Vercel, y los E2E con base de datos real (local) corren en cada PR. Lección aprendida con un fallo real. | Métricas, apartado 7.2 |
| ¿Por qué una sola participante? | Era la persona disponible; está documentado como limitación y se buscaron problemas graves, no medir. | Resultados del test, apartado 6 |
| ¿Por qué no Sentry u otro servicio de errores? | Un informe de error del navegador podría llevar datos de salud a un tercero; con un piloto tan pequeño no compensa. Lo cubren el logger del servidor, el aviso ante errores (UX-14), el E2E antes de producción y el *smoke* después. | ADR-08, apartado 4 |
| ¿Por qué la cuenta de prueba es administradora? | Para que quien evalúa vea el panel. Por eso su contraseña se entrega en privado y cumple la política; la cuenta se elimina tras la evaluación. | TFM-01 |
| ¿Por qué la cobertura no es del 100 %? | Se mide por niveles: lo crítico al 100 % de líneas; la interfaz la cubren los E2E. Un número total alto no dice qué está sin probar. | V&V, apartado 1.3 |
| ¿Límites del plan gratuito? | 12 funciones en Vercel Hobby (una por capacidad) y pausa de Supabase tras 7 días (workflow cada 5 días). | ADR-03, apartado 6.1 |

## 4. Después de la demo

- Anotar las preguntas y comentarios literales del tutor en una sección nueva de este documento (qué preguntó, qué se respondió, qué cambia).
- Lo que salga se clasifica como en la validación: problemas al tablero, ideas a "Primeras historias del Ciclo 2".
- Siguiente revisión de métricas con la primera entrega real a `main` (métricas, apartado 7.6).
