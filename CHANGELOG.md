# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/). Hasta la `1.0.0` (primera entrega a producción, 29 sept. 2026) fue `0.x`, en desarrollo inicial. Desde entonces: MINOR = funcionalidad nueva, PATCH = corrección, MAJOR = un cambio que obligue a migrar datos o rompa lo existente.

## [Sin publicar]

### Añadido (RF-49: páginas de categoría y viajes)

- **"Categorías" en la cabecera:** todas las categorías del catálogo en tarjetas; por ahora solo Aventura tiene página, el resto sale como "Próximamente".
- **Página de Aventura:** descripción, tu última nota, tus experiencias del diario y **Tus viajes**: un mapa a todo lo ancho (Leaflet) con los países visitados pintados, zoom con la rueda del ratón, y debajo el formulario y la lista. Un viaje es un país de una lista con búsqueda (o pulsado en el mapa) y un año, con el mes opcional; sin texto libre. Puede ser de cualquier año o un plan. No cambia ninguna nota y no va a la IA. **Migraciones 0029 y 0030.**
- El mapa no usa recursos externos: las formas de los países (Natural Earth) van dentro de la app y la política de contenido no cambia.

### Añadido (UX-11: cabecera y avisos)

- **Campana de avisos** en la cabecera: reúne los avisos que ya daba Inicio (revisar la nota tras un evento, ideas con fecha que ha llegado, categorías sin revisar), con el número de los nuevos. Solo dentro de la app.
- **Cabecera reorganizada:** Inicio, Categorías y Entrevista; el avatar y el nombre abren un menú con Mi perfil, Administración y Cerrar sesión; idioma como "ES | EN"; resaltado a toda la altura, sin esquinas redondeadas.
- Botón flotante **"Volver arriba"** en la entrevista, con un fundido.

### Cambiado

- **Ventana de ideas:** pestañas de verdad (subrayado y fondo suave de la marca), la idea como una cita (comillas, letra con serifa, azul marino), la misma letra en "De otras personas" y una X para cerrar arriba a la derecha.
- **Mi perfil:** el formulario a la izquierda, con aficiones y avatares a todo lo ancho; el zoom del avatar tarda 1 segundo.
- **Migas de pan** dentro del contenedor de cada página.
- **Inicio:** botones con color e icono.
- **Entrevista:** accesos a cada categoría también en escritorio (la pregunta aparece con un fundido) y menos espacio entre módulos.
- Calendario: hoy en naranja y sin borde, los días con algo anotado en azul marino y el día elegido con un contorno; antes el azul tapaba el naranja.

### Añadido (RF-46, RF-47 y RF-48: perfil, fecha para una idea y calendario)

- **Profesión y aficiones en "Mi perfil" (RF-46):** opcionales y de listas cerradas, nunca texto libre. Con las ideas con IA activadas, se usan para adaptar la redacción; nunca en categorías sensibles. Al cambiarlas, las ideas ya personalizadas se rehacen. **Migración 0025.**
- **Una fecha orientativa para una idea guardada (RF-47):** al pulsar "Me gusta" la app pregunta "¿Cuándo te apetece probarla?" (en una semana, en un mes, otra fecha o sin fecha). En Inicio, las ideas guardadas salen por fecha. Sin avisos fuera de la app. **Migración 0026** (después de la 0024).
- **Eventos propios y calendario (RF-48):** pantalla "Calendario" en Mi perfil, con la vista de un mes, los días con eventos o ideas con fecha marcados y un formulario para añadir eventos (título, día y, si se quiere, varias categorías). En Inicio, "Próximamente" y, desde el día de un evento con categorías, una invitación a revisar la nota (la puntuación nunca cambia sola; el formulario lo explica). **Migraciones 0027 y 0028.**
- Eventos y fechas entran en la exportación de datos y se borran con la cuenta.
- `api/agenda/[action].ts` es la **duodécima función**: el plan Hobby no admite más.

### Corregido

- Dos peticiones simultáneas de una cuenta recién creada podían chocar al crearle sus categorías y una acababa en error: la escritura se repite cuando pasa.
- Un "Me gusta" pulsado nada más abrirse la ventana de ideas podía perderse en pantalla (lo pisaba la carga de las reacciones): los botones salen ya con las reacciones cargadas.

### Añadido (RF-19, guardar ideas)

- En la ventana de ideas, cada idea lleva **"Me gusta"** (la guarda y lo dice) y **"No me gusta"** (deja de salir en esa categoría; se pueden recuperar). La ventana es más ancha, con la misma altura en todas las pestañas, y pestañas y flechas con aspecto de botón; explica cuántas ideas no se ven y por qué.
- En Inicio, **"Tus ideas guardadas"**, con "Hecha" y "Quitar".
- Las reacciones entran en la exportación de datos y se borran con la cuenta. **Migración 0024** (`idea_reactions`): ejecutarla antes de desplegar.

### Cambiado

- **Requisitos de la contraseña plegados:** en el registro y el cambio de contraseña se ven al pulsar un botón de información, con marcas pequeñas; se abren solos si la contraseña no cumple al enviar.

### Añadido (categoría Salud)

- Nueva categoría **Salud**, sensible: pide consentimiento y queda fuera de la IA y de las experiencias compartidas. Con cinco ideas genéricas y nada clínicas, seis opciones de "¿Qué te ayuda?" y sus ejemplos. **Migración 0023**: ejecutarla antes de desplegar.

### Añadido (segunda prueba con una usuaria: UX-09 y UX-10)

- Un mensaje al guardar una puntuación de 8 o más, en un aviso que se cierra solo a los 5 segundos: reconoce el momento e invita a anotar o compartir qué está ayudando; con 9 o 10 en una categoría no sensible, felicita con sobriedad.
- "Cómo funciona" explica en un cuarto paso que se puede compartir de forma anónima lo que funciona. "Compartir de forma anónima" pasa a ser un botón.
- En Inicio, una invitación a volver a mirar las categorías que llevan más de un mes sin actualizarse.
- Los avatares del perfil crecen al señalarlos.

### Corregido (RF-43, compartir experiencias)

- Las categorías añadidas desde administración (como "Idiomas") no se podían compartir: no tienen clave de catálogo y la app las dejaba fuera sin avisar. Ahora cualquier categoría no sensible se puede compartir.

### Cambiado (textos)

- "Categorías" en toda la interfaz, en lugar de mezclarlo con "áreas".

### Cambiado (paleta de la app)

- La línea de los gráficos usa un verde azulado vivo propio, en lugar del color de marca.
- Cabecera de escritorio en tres grupos separados: páginas, cuenta (avatar, nombre y salir) e idioma.
- Colores nuevos en toda la app, a partir de cinco tonos elegidos por el autor (azul noche, gris azulado, gris muy claro, plata y casi negro), definidos en un solo sitio. Los colores con significado (puntuaciones, errores, avisos, ideas destacadas) no cambian.

### Añadido (UX-08, portada con imagen)

- La portada lleva de fondo una imagen generada con IA (una persona frente a su reflejo), con una capa oscura para que el título, la descripción y los botones se lean. Dos tamaños en WebP: el móvil descarga solo el suyo. La propia portada dice que la imagen está generada con IA.
- La primera vista de la portada ocupa toda la pantalla; al bajar, "Cómo funciona" sube sobre una segunda imagen de fondo que no se mueve. Con "reducir movimiento" activado, la página se desplaza de forma normal. El texto va en la parte baja, para que la imagen se vea.
- Al cerrar sesión se vuelve a la portada, no al formulario de inicio de sesión.
- En la portada, selector de idioma de texto ("ES | EN") y una flecha que baja a "Cómo funciona".
- Skill del proyecto para generar imágenes con el proceso de revisión (`.claude/skills/imagenes-con-ia/`).

### Añadido (RF-26, avatares; en curso)

- Catálogo de 12 avatares definido por descripciones de rasgos visibles, con un test que impide palabras de género, origen, religión, edad o valoración del aspecto.
- `scripts/avatars/generate_avatars.py` (herramienta offline, Python): Claude Haiku razona si cada descripción cae en algún estereotipo antes de generar, un modelo de imagen de HuggingFace (SDXL base) ejecutado en local genera las candidatas, y el autor publica solo las que revisa. Por qué en local y qué sesgo se encontró por el camino: ADR-05, apartado 4.1.1.
- El perfil admite un avatar del catálogo (solo los publicados; `null` lo quita). **Migración 0022** (`profiles.avatar_key`).
- Selector de avatar en "Mi perfil"; el elegido se ve en la cabecera y en la entrevista. Sin avatares publicados, la app no cambia.

### Corregido (perfil)

- Al guardar el perfil, la caché perdía la elección de IA del usuario (ideas personalizadas y sugerencias) hasta recargar: ahora conserva el perfil tal como lo devuelve el servidor.

### Corregido (RF-38, recuperar la contraseña)

- El enlace del correo de recuperación podía dejar a la persona en la portada, sin explicación, en vez de en "Elegir nueva contraseña". La portada reconoce ahora un enlace de recuperación (o el aviso de que está caducado) y lleva a su pantalla; y la dirección de vuelta se construye tolerando una barra final o espacios en `APP_URL`.

### Corregido (interfaz)

- Todos los campos de texto medían 33 px de alto en vez de 56, y la etiqueta quedaba descolocada sobre el borde cuando el campo estaba vacío. Un `* { box-sizing: border-box }` propio, sin capa CSS, ganaba desde la v1.2.0 al valor que Material UI necesita en sus campos. Se quita (ya lo aplica el `CssBaseline` de MUI dentro de su capa) y un E2E vigila la altura.
- Las pantallas públicas de cuenta (registro, inicio de sesión, recuperar y cambiar contraseña) pasan de 360 a 440 px de ancho en escritorio: el rastro de navegación cabe en una línea.

### Cambiado (dependencias)

- 17 actualizaciones menores y de parche (PR de Dependabot), entre ellas React 19.3, Vite 8.3 y zod 4.6.5.

## [1.3.0] - 2026-10-11

El modelo real de IA, la cuenta de prueba para la entrega del TFM y la primera revisión completa de seguridad. **Migraciones 0020 y 0021** (las dos ya ejecutadas en producción). Variables nuevas en Vercel: `AI_IDEAS_PROVIDER`, `ANTHROPIC_API_KEY` y `DEMO_USER_EMAIL`.

### Seguridad (primera revisión completa: [plan de seguridad](docs/security/01_Plan_Seguridad.md))

- **Contraseñas fuertes (SEC-01):** las nuevas necesitan de 12 a 72 caracteres, con minúscula, mayúscula, número y símbolo, sin secuencias (`1234`, `qwerty`), sin ser una palabra común aunque lleve sustituciones (`P4ssw0rd!2026`) y sin el nombre ni el email. Registro y cambio de contraseña enseñan los requisitos desde el principio y los van marcando; el inicio de sesión no da ninguna pista. Las cuentas que ya existen no cambian.
- El registro ya no dice "ya existe una cuenta con ese email": mensaje neutro.
- **Límite de intentos (SEC-02)** en inicio de sesión, registro y recuperación de contraseña, por IP y por cuenta, contado en la base de datos. **Migración 0021** (`attempt_counters` y su función): ejecutarla antes de desplegar. Sin ella el servidor deja pasar y lo anota.
- **Cabeceras de seguridad (SEC-03):** política de contenido (CSP), `nosniff`, protección contra marcos, `Referrer-Policy` y `Permissions-Policy` en todas las respuestas; la API, sin caché. `npm run smoke:prod` las comprueba.
- Las acciones que cambian datos rechazan las peticiones que vienen de otra web (403) y los cuerpos desmesurados (413); longitudes máximas en los campos de cuenta.
- Los controladores públicos comparten una plantilla (`publicHandler`); el cliente de Supabase del servidor ya no guarda sesión.
- **IA (SEC-04):** el prompt de "Sugerir opciones con IA" trata la experiencia como un dato y no sigue órdenes que contenga; la evaluación con el modelo incluye cinco intentos de inyección, los cinco resistidos.
- Toda lista de entrada tiene longitud máxima: junto con el tope de tamaño, deja sin efecto un fallo de zod sin corregir (CVE-2023-54404) que permitía agotar la memoria de una función con una lista enorme. Lo encontró Snyk, probado como segunda herramienta.
- **Dependencias:** corregidas 2 vulnerabilidades altas en paquetes de desarrollo. Dependabot (`.github/dependabot.yml`) y un workflow de seguridad (`npm audit` y CodeQL) en cada PR y cada lunes.
- `npm run backup:db`: copia de seguridad de la base de datos en un archivo local (el plan gratuito de Supabase no guarda copias).

### Añadido (TFM-01, cuenta de prueba para la entrega)

- `npm run demo:reset`: crea o restaura la cuenta de prueba (seis áreas, un año de historial, ideas abiertas, opciones, diario, IA activada) y una segunda cuenta que comparte experiencias con ella. Borra solo esas dos cuentas; contra la base real pide `-- --yes`, y con `-- --local` usa el Supabase local. Contenido en `demoAccount.json`.
- La cuenta de prueba no se puede eliminar desde la app si `DEMO_USER_EMAIL` está definida en el servidor: se explica que es de demostración.
- README con capturas, licencia (todos los derechos reservados) y qué probar con la cuenta.

### Corregido (herramientas)

- Los E2E con `api/` ya no muestran `MaxListenersExceededWarning`: no era una fuga (0 oyentes al terminar, medido), sino hasta 30 peticiones a la vez contra un límite por defecto de 10. Se sube el límite de ese canal a 100.

### Cambiado (documentación)

- La entrega del TFM pasa a "hacia el 20 de octubre, como máximo el 26" en los documentos vivos (antes figuraba el 31). AGENTS.md: "Tareas clave" al día.

### Añadido (RF-40b, el modelo real de IA)

- Las ideas personalizadas (RF-40) y las sugerencias desde el diario (RF-45) pueden funcionar con el modelo real: Claude Haiku 5.5 por la API de Anthropic, con salida estructurada. Se activa con `AI_IDEAS_PROVIDER=anthropic` y `ANTHROPIC_API_KEY` (solo en el servidor); sin clave queda apagado. En local y en los tests sigue el proveedor simulado: desarrollar no gasta crédito.
- Tope diario de usos de IA por usuario (`AI_DAILY_LIMIT`, 40 por defecto), contado en la base de datos. Superado, se ven las ideas originales. **Migración 0020** (`ai_usage` y su función): ejecutarla antes de activar el proveedor real.
- El revisor recibe también lo que el usuario marcó en "¿Qué te ayuda?", para no tomar por inventado lo que el usuario dijo.
- Evaluación con el modelo real (`npm run eval:ai`, solo a mano: gasta céntimos): 17 de 20 ideas llegan al usuario, el revisor para 23 de 23 borradores malos y las sugerencias no inventan ninguna clave (ADR-05, apartado 4.3.4).
- La política de privacidad explica el contador de uso.
- Mensajes claros cuando la IA no propone nada: "No hemos encontrado opciones nuevas" (ya están marcadas las que encajan o el texto no encaja con ninguna), tope diario agotado, o proveedor no disponible. Antes los tres casos daban el mismo texto. La ventana de ideas también avisa cuando enseña la idea original por el tope.

## [1.2.1] - 2026-10-07

Correcciones de la revisión de código del Ciclo 2 y una plantilla común para los controladores. Sin migraciones.

### Cambiado (código: controladores)

- Los controladores con sesión usan una plantilla común (`sessionHandler`): método, sesión, validación, caso de uso y una sola tabla de errores a estados HTTP, en lugar de la misma secuencia copiada en cada uno (unas 750 líneas menos). Sin cambios para el usuario. Los de administración del catálogo pasan además a no guardarse en cachés intermedias y a registrar los accesos denegados, como el resto de la administración (ADR-03, apartado 3.4).

### Corregido

- Marcar opciones de "¿Qué te ayuda?" y "¿Qué te lo pone difícil?" casi a la vez ya no hace que se pierda una: cada acción guarda solo su lista.
- Si tras guardar una puntuación falla la relectura de puntuaciones o ideas, la respuesta ya no es un error (el guardado era válido y reintentar duplicaba la evaluación).
- Las fechas y cantidades con separadores ("06-10-2026", "1.200.000") ya no se toman por teléfonos: se pueden compartir (RF-43) y llegan enteras a la IA (RF-45).
- La pestaña "Con IA" ya no vuelve al texto curado sin avisar cuando el carrusel ofrece ideas generales: el servidor acepta las mismas ideas que ofrece el carrusel, y este decide por la clave de la categoría.
- Borrar del diario una experiencia que venía de una nota antigua vacía también esa nota en su evaluación: ya no sale en el historial ni en la exportación.
- Los E2E con `api/` esperan también a la tabla `experiences` tras vaciar la base (evita fallos intermitentes).

### Cambiado

- `withTimeout` y `bestEffort`, en `shared/`, en lugar de copiados; quedan en inglés los últimos nombres en español (`ruta`, `esAdmin`, `existentes`, `errorActualizar`); fuera un script temporal subido por error.

## [1.2.0] - 2026-10-06

Antes de desplegar: migraciones **0013 a 0019**, en orden (ya ejecutadas en producción). Ninguna rompe datos: añaden columnas y tablas, o cambian la categoría Deporte.

### Cambiado (diseño)

- Capas CSS: Material UI va en la capa `mui` y el CSS propio (`skin.css`, clases `mlm-`) le gana sin `!important` (ADR-07, apartado 4.1). Comprobado con un E2E en navegador real.
- El selector de idioma de la cabecera es un interruptor entre las banderas de España y Reino Unido (pulsar una bandera también elige su idioma).
- Cerrar sesión es el icono típico de salir, con su nombre accesible y *tooltip*; en el menú móvil, icono y texto.

### Añadido (RF-30, líneas de ayuda)

- Pantalla pública `/ayuda`, "¿Necesitas ayuda ahora?", con y sin sesión (con la cabecera y las migas que tocan en cada caso, para poder salir): la línea 024 y el 112 con un botón para llamar, Find A Helpline para fuera de España, y que la app no es un servicio profesional ni de emergencias. Las líneas son datos estáticos; solo se consulta la sesión, para la cabecera.
- El enlace "¿Necesitas ayuda ahora?" al pie de todas las pantallas (públicas y protegidas), junto al diario de experiencias y en la pestaña "De otras personas". Igual para todo el mundo: nunca aparece por lo que alguien puntúe o escriba (RES-09).
- Las líneas pasan a `wellbeing/domain/catalog/helplines.json` (CAT-01) y sus textos a las traducciones, con tests de integridad. El *smoke* de producción comprueba también `/ayuda`.

### Cambiado (Deporte deja de ser sensible)

- Deporte ya no es categoría sensible: activarla no pide consentimiento, y entra en las ideas con IA (RF-40), las sugerencias (RF-45) y las experiencias compartidas (RF-43), como el resto. Siguen siendo sensibles Sexo y Espiritualidad. Decisión del autor ("cualquier categoría puede tener algo sensible"); reversible si llega feedback negativo. Los consentimientos ya dados se conservan como historial.
- **Migración 0018** (catálogo y copia de cada usuario): ejecutarla antes de desplegar.
- Su descripción pasa a "Actividad física y movimiento" (antes, "y salud"): **migración 0019**, que no pisa una descripción editada desde el admin.

### Añadido (RF-43, compartir experiencias que funcionan)

- Con una última puntuación de 8 o más en una categoría, cada experiencia del diario ofrece "Compartir de forma anónima", y la app lo sugiere bajo el diario. Antes de publicarse, una ventana enseña cómo la verán otras personas (solo el texto: sin nombre, fecha ni puntuación) y qué implica. Nunca en categorías sensibles ni en Pareja.
- Filtros al compartir: datos de contacto (emails, teléfonos, enlaces, números largos), consejo de salud o de dinero (los grupos clínico, profesional y financiero de `safetyTerms.json`) e insultos (`offensiveTerms.json`). Si falla alguno, no se publica y se explica qué quitar. El diario privado sigue sin validarse, y cómo se siente la persona nunca se filtra (RES-09).
- La ventana de ideas tiene pestañas cuando hay más de una fuente: "De la app" (el carrusel de siempre), "Con IA" (RF-40, en lugar del enlace "Ver la idea original") y "De otras personas (N)", con hasta 10 experiencias compartidas de esa categoría en el idioma de la interfaz, el aviso de que no son consejo profesional y "Reportar": un reporte la oculta al momento para todos, y su autor la ve como "Retirada tras un reporte" (no se puede volver a compartir).
- "Dejar de compartir" en el diario y en la sección nueva "Experiencias compartidas" de *Privacidad y datos*. La exportación (RF-05) dice qué experiencias están compartidas o retiradas; borrarlas o borrar la cuenta borra lo compartido. Apartado nuevo en la política de privacidad.
- **Migración 0017** (`experiences.shared_at`, `shared_locale`, `shared_category_key`, `reported_at`): ejecutarla antes de desplegar. `PATCH /api/categories/diary` y `/api/categories/shared` (sin funciones nuevas: 11/12).
- Abrir la ventana de ideas con categoría hace una lectura más, la de "De otras personas" (una vez; luego sale de la caché). El guardado sigue siendo de 2 peticiones (PERF-01).

### Añadido (RF-45, sugerencias de la IA a partir de una experiencia)

- Consentimiento propio en *Privacidad y datos*, "Sugerencias de la IA a partir de tus experiencias" (desactivado por defecto, aparte del de RF-40), con qué se envía, qué se quita y qué nunca. Con él, cada experiencia del diario de una categoría no sensible ofrece "Sugerir opciones con IA".
- La IA solo traduce esa experiencia a las listas cerradas ("¿Qué te ayuda?", "¿Qué te lo pone difícil?"): se ven como propuestas "Sugerido por IA" que el usuario marca o descarta; aceptar una la marca como si la tocara él (con su "✓" y el pulso en las ideas). Nunca se enseña ni se guarda texto de la IA.
- Salvaguardas: salida validada (solo claves posibles de esa categoría), datos personales quitados antes de enviar (emails, enlaces, teléfonos, números largos; los nombres no, y se avisa), nunca categorías sensibles, ids ni puntuaciones, y caída a "sin sugerencias" si algo falla o tarda más de 8 s. Proveedor *Fake* (palabras clave) en local y E2E; el modelo real, con RF-40b.
- **Migración 0015** (`profiles.ai_suggestions_enabled` y su fecha): ejecutarla antes de desplegar. Acciones `/api/accounts/ai-suggestions` y `/api/recommendations/suggest-options` (sin funciones nuevas: 11/12). La elección entra en la exportación (RF-05).
- **Pareja queda fuera de la IA** (ni ideas personalizadas ni sugerencias) sin volverse sensible: marca `aiExcluded` en el catálogo, **migración 0016** (ejecutarla antes de desplegar). No pide consentimiento para activarla; las sensibles siguen fuera siempre.
- Aviso al pulsar "Sugerir opciones con IA" si la experiencia lleva insultos o palabras ofensivas (lista curada `offensiveTerms.json`): el usuario puede enviarla igualmente o cancelar. El diario no se valida, y cómo se siente la persona ("estoy fatal", "no puedo más") nunca avisa.
- Si la función existe pero no está activada, el diario dice dónde activarla ("Actívalas en Privacidad y datos"); antes no había forma de descubrirla desde la entrevista.
- El *Fake* reconoce otras formas de la misma palabra ("viajé" → "Viajar", "comida nueva" → "Probar comidas nuevas"), para poder probarlo con frases naturales.
- La política de privacidad tiene su apartado, y los textos de RF-40 ("nunca se envían tus experiencias privadas") pasan a decir "para estas ideas", porque ya no es cierto en general.

### Añadido (RF-44, diario de experiencias)

- "Tus experiencias (privadas)" en cada pregunta: varias por categoría, con su propio "Añadir" (no hace falta puntuar), "✓ Guardada" en la línea del título, la lista de las 3 más recientes con su fecha y "Ver todas", y borrar cada una con confirmación. Siguen siendo privadas: nunca van a la IA.
- **Migración 0014** (tabla `experiences`): copia a ella las notas que ya había en las evaluaciones, con su fecha; ejecutarla antes de desplegar. La nota original se conserva en su evaluación (inmutable, RF-12), pero la interfaz ya solo enseña las experiencias: en la entrevista, en el historial de Resultados (en su día, también los días sin puntuaciones) y no en las tarjetas. Acción `/api/categories/diary` (sin función nueva: 11/12). Entran en la exportación y el borrado de datos (RF-05).
- "Guardar" vuelve a ser solo para la puntuación (antes también se activaba al escribir la nota).

### Cambiado (CAT-01, contenido curado como datos)

- Las ideas del catálogo, las situaciones de RF-42 con sus choques, las opciones de "¿Qué te ayuda?" y los términos del filtro de IA pasan de constantes en el código a JSON en `domain/catalog/` de su módulo (`ideas.json`, `situations.json`, `safetyTerms.json`, `helpOptions.json`), con la forma de las futuras tablas de ADM-04. Sin cambios de comportamiento: los tests de siempre pasan sin tocarlos.
- Tests de integridad del catálogo: claves únicas, choques que apuntan a ideas que existen, opciones de categorías estándar, siempre alguna idea general sin choques y texto en español e inglés para todo.

### Añadido (RF-42, situaciones que lo ponen difícil)

- "¿Qué te lo pone difícil?" en cada pregunta con una puntuación baja (o una idea abierta): situaciones de una lista cerrada (salir de casa, sitios con mucha gente, dar el primer paso…), nunca rasgos ni salud, solo las que afectan a las ideas de esa categoría. Se guardan al momento.
- Las ideas que chocan con lo marcado no se proponen: ni en el carrusel, ni al crear una recomendación nueva, ni personalizadas por IA (el servidor lo rechaza). Las situaciones no se envían a la IA. Si chocan todas las de una categoría, se usan las generales.
- **Migración 0013** (`categories.difficulty_tags`): ejecutarla antes de desplegar. Acción `/api/categories/difficulties` (sin función nueva: 11/12). Entran en la exportación de datos (RF-05).
- La lista de situaciones y qué idea choca con cuál, pendientes de revisión del autor (en la historia RF-42).
- Reacción al marcar una opción (aquí y en "¿Qué te ayuda?"): un "✓" con lo que cambia ("Ideas actualizadas", "Lo tendrán en cuenta", "Para tus próximas ideas" o "Guardado"), en la línea de su título para que al irse no salte nada (en móvil, dentro del título un momento); y "Ideas para Economía (4)" dice cuántas quedan y da un pulso suave (sin pulso con "reducir movimiento"). "Guardar" no se activa: crearía una evaluación sin cambio de puntuación.
- Los tres títulos de cada pregunta llevan icono y flecha para que se vea que se despliegan; "¿Qué te ayuda en esta área?" pasa a "¿Qué te ayuda?". "Tu experiencia (privada)" se cierra con su título o con una X que borra lo escrito. "Ideas para…" va debajo de las tres, como su resultado.

## [1.1.0] - 2026-10-04

### Cambiado (proyecto)

- El repositorio pasa a llamarse `my-life-mirror` (antes `my-sims`), igual que el paquete y el Supabase local (`project_id`). En una copia ya clonada: `git remote set-url origin https://github.com/MACruzDeveloper/my-life-mirror.git`, y parar el Supabase local antiguo (`npx supabase stop --project-id my-sims`) antes de arrancar el nuevo, que empieza vacío.

### Cambiado (UX-07, primera entrevista por pasos)

- La primera entrevista va por pasos, con un indicador arriba: 1) introducción y escala, con "Empezar"; 2) "¿De qué quieres hablar?", con cada categoría como un botón grande (nombre y descripción) que se marca al tocarlo, "Elegir todas" y las sensibles aparte con su consentimiento; 3) las preguntas, con las categorías en su acordeón y la introducción plegada. Así se ve qué preguntas se añaden, y en el móvil se gana pantalla. Quien ya tiene respuestas entra directamente a actualizar.

### Cambiado (UX-06, distribución de la entrevista y menú plegable)

- Al actualizar la entrevista, "Tus categorías" y "Requieren tu consentimiento" van en dos acordeones plegados con cuántas hay activas ("2 de 6 activas"): en escritorio, en la columna derecha encima del progreso; en móvil, encima de las preguntas. En la primera entrevista se eligen en su paso (UX-07).
- El menú de Mi perfil es un `Drawer` de Material UI con iconos: en escritorio se puede plegar a solo iconos (se recuerda en el navegador); en móvil se abre con un botón que muestra la sección actual ("☰ Entrevista"), para no confundirlo con el menú de la cabecera.
- La introducción y las preguntas de la entrevista van en dos bloques con fondo distinto (las preguntas, con su título "¿Cómo te sientes en cada una?").
- La columna derecha de la entrevista (categorías y progreso) se queda fija entera al desplazarse; el progreso también es un acordeón (abierto por defecto, con el resumen visible al plegarlo).
- Cabecera oscura y fija arriba; al bajar se compacta (menos altura y letra más pequeña) con una transición breve.
- Una categoría recién añadida sale la primera y entra con una animación breve de derecha a izquierda (solo `transform`/`opacity`; ninguna con "reducir movimiento").
- *Breadcrumbs* a la izquierda en las pantallas protegidas; la entrevista sin margen superior.

### Cambiado (UX-05, respuesta inmediata en la entrevista)

- Cada categoría de la entrevista tiene su propio botón "Guardar", junto a su puntuación y su experiencia, y guarda solo esa categoría. Desaparece el botón único "Guardar cambios" del final, que con varias categorías abiertas quedaba fuera de la vista.
- Al guardar: "Guardado ahora" en la propia categoría; si el guardado abre una idea nueva (puntuación baja), una ventana "Cambios guardados" con la idea (personalizada si RF-40 está activado), el aviso y los enlaces a Resultados e Inicio. Si falla, el error sale en la categoría.
- Bajo cada pregunta, la última actualización ("Última actualización: 18 de septiembre de 2026 · 6 → 4") y tu última experiencia (privada).
- El historial de cambios pasa de la entrevista a Resultados, agrupado por día (con el cambio del día por categoría y sus experiencias).
- El "Guardar" de cada categoría va a la derecha de su puntuación (debajo en móvil si no cabe).
- La ventana de ideas es un carrusel con las 5 ideas de la categoría (primero la recomendada, "Idea 2 de 5"), en la entrevista, Inicio y Resultados.
- Las categorías con una idea abierta enseñan "Ideas para Economía" en su pregunta.
- En escritorio, la columna derecha de la entrevista muestra el progreso: cuántas categorías están respondidas y el estado de cada una (sin responder, sin guardar, guardada hoy o el día X); tocar una lleva a su pregunta.
- RF-40 v1.1: la IA reescribe la idea que se ve en el carrusel (ya no elige entre las 5), y una idea personalizada se reescribe si cambian las opciones de "¿Qué te ayuda?" de su categoría. **Migración 0012** (`personalized_ideas` por recomendación, idea e idioma, con las opciones usadas): ejecutarla antes de desplegar.

### Cambiado (PERF-01, menos llamadas al guardar)

- El `POST /api/assessments` devuelve también las últimas puntuaciones y las recomendaciones abiertas; la entrevista las pone en la caché y solo vuelve a pedir el historial. De 4 llamadas a 2 por guardado, y el modal de la idea sale en la mitad de tiempo (medido en local). Un E2E lo vigila.
- La barra de desplazamiento de la columna derecha, fina y semitransparente; sus acordeones, sin bordes ni sombras.

### Corregido (entrevista)

- Si las categorías o las puntuaciones no cargaban, el aviso se quedaba hasta volver a entrar: ahora tiene "Reintentar". Sigue sin haber reintentos automáticos (un fallo se enseña, no se esconde).

### Corregido (UX-06)

- Con `npm run dev:local` abierto, lanzar los E2E rompía la app ("Invalid hook call", "Cannot read properties of null (reading 'useContext')", dos copias de `@emotion/react`): los dos servidores de Vite compartían la caché de dependencias (`node_modules/.vite`) y, al re-empaquetarla uno, el navegador del otro mezclaba versiones. Cada servidor tiene ahora la suya (`VITE_CACHE_DIR`): `.vite` (`npm run dev`), `.vite-local` (`dev:local`), `.vite-e2e` y `.vite-e2e-api` (los tests).
- Las consultas pasan a `fetch` la señal de cancelación de TanStack Query (`AbortController`): una carga cancelada u obsoleta aborta su petición en lugar de solo ignorar la respuesta.
- Al abrir una idea personalizada en Inicio se hacían dos peticiones iguales (una sin las opciones de "¿Qué te ayuda?", porque las categorías aún no habían llegado, y otra con ellas). Ahora espera a tener las categorías.

- El menú lateral de Mi perfil quedaba por encima de la cabecera fija al desplazarse.
- Si se abría una idea justo después de marcar una opción de "¿Qué te ayuda?", podía escribirse con las opciones de antes (el guardado aún no había llegado al servidor) y quedarse así en la caché. Ahora, cuando el servidor confirma la opción, se cancela lo que estuviera en curso y las ideas personalizadas se vuelven a pedir (invalidar sin cancelar no repetía una primera carga en curso). Lo destapó un E2E que fallaba 1 de cada 4 veces.
- Al reactivar una categoría con puntuaciones guardadas, su pregunta salía "sin responder" y un segundo después saltaba a la puntuación guardada. Ahora aparece ya con ella.

### Corregido (E2E)

- Los E2E con `api/` fallaban de vez en cuando (1 de cada 4-5 ejecuciones): tras `supabase db reset`, la API local tarda un instante en volver a ver las tablas ("Could not find the table … in the schema cache"). El script espera a que responda por ellas antes de empezar. Seis ejecuciones seguidas sin fallos.

### Cambiado (imports)

- Imports del código del servidor con `#shared/…` y `#modules/…` (imports nativos de Node, sección `imports` de `package.json`) en lugar de rutas relativas largas (`../../../shared/domain/locales.js` → `#shared/domain/locales.js`): 265 imports en 72 archivos. Dentro del mismo módulo siguen relativos; los componentes de `ui/` siguen con `@`.
- `check:api` copia el mapeo `imports` a su `package.json` temporal (sin él, cada función daba una falsa alarma al cargar). Antes de convertir nada se comprobó con un `vercel build` real: las 11 funciones cargan desde su salida.

### Cambiado (código)

- Los términos del filtro de ideas con IA pasan a `ideaSafetyTerms.json` (por idioma y tipo, con `*` para "y lo que siga"), fuera del código y solo en el servidor.
- Listas de valores en un solo sitio (`as const` con el tipo derivado): roles (estaban copiados en 4 sitios), género (en 3), estados de categoría y de recomendación, tendencias, bandas, periodos, entornos. Las validaciones de la API (`z.enum`) y la interfaz las importan.

### Cambiado (infraestructura)

- *Keep-alive* de Supabase cada 5 días en lugar de a diario (la pausa llega a los 7; el hueco más largo entre ejecuciones es de 5 días).
- El Supabase local vuelve a arrancar solo al abrir Docker Desktop: `scripts/local-supabase.mjs` marca sus contenedores "reiniciar salvo que se paren" (sin docker-compose). `npx supabase stop` lo apaga.

### Añadido (RF-40a, ideas personalizadas con IA contra un *Fake*)

- Interruptor "Ideas personalizadas con IA" en *Privacidad y datos* (desactivado por defecto, solo si el despliegue tiene proveedor), con qué se envía y qué nunca. Desactivarlo borra las ideas personalizadas.
- Al abrir una idea, si está activado: la IA elige una de las ideas curadas de esa categoría y la reescribe con lo que le ayuda al usuario (RF-41) y su tendencia; se ve con la etiqueta "Personalizada con IA" y la original a un clic, siempre con el aviso de RES-05. Se guarda y no se vuelve a pedir.
- Caída segura al texto curado en cualquier duda: sin activar, sin proveedor, categoría sensible, error, tiempo agotado, filtro (`checkIdeaSafety`, con un conjunto de evaluación de 22 casos) o revisión.
- Catálogo de ideas de 2 a 5 por categoría (es/en), redactadas con ayuda de IA y **pendientes de revisión del autor**.
- Migración `0011_personalized_ideas.sql`; `api/recommendations/[action].ts` con `personalize` (11/12 funciones) y la acción `/api/accounts/ai-ideas`; la sesión dice si la función está disponible. Variable `AI_IDEAS_PROVIDER` (`fake` en local y E2E; sin valor en producción hasta RF-40b).
- Política de privacidad: apartado de ideas con IA. Exportación y borrado de datos (RF-05) incluyen la elección y las ideas.

### Corregido

- Escribir en "Tu experiencia (privada)" iba lento (~1 s por palabra en un móvil medio): cada tecla volvía a pintar la entrevista entera. El campo guarda su texto en su propio componente (`ExperienceNote`) y la entrevista solo se entera de si tiene texto o no: de 169 ms a 24 ms por tecla con la CPU 6 veces más lenta.
- `UpdateProfile` reconstruía el perfil campo a campo: guardar el nombre habría desactivado sin avisar la elección de RF-40. Ahora parte del perfil existente.
- El test "todas las plantillas tienen texto en es/en" pasaba nombres de categoría en vez de claves y solo comprobaba las generales; ahora comprueba las 45 de categoría y las 3 generales.

### Añadido (RF-41, experiencias por categoría)

- "¿Qué te ayuda en esta área?" en cada pregunta de la entrevista: 5-7 opciones propias de cada categoría estándar, que se guardan al momento (optimista, se deshace si el servidor falla). Son lo único que podrá usar la IA de RF-40, y solo si el usuario lo activa.
- La nota pasa a "Tu experiencia (privada)", con el aviso de que solo la ve el usuario y nunca se envía a la IA ni se comparte.
- Migración `0010_category_experience.sql` (`categories.experience_tags`), caso de uso `SetCategoryExperience` (solo acepta opciones de esa categoría), acción `/api/categories/experience` (sin función nueva: 10/12). Las opciones entran en la exportación de datos (RF-05). E2E: se guarda y sigue marcada al recargar.

### Cambiado (limpieza)

- Últimos restos en español del pase anterior: nombres locales en las desestructuraciones de los handlers (`verifySession: verificarSesion`), el método `registrar` de `AuthProvider` (→ `register`) y los nombres de las funciones internas de seis casos de uso.

### Cambiado (UX-04)

- El historial de cambios de la entrevista empieza plegado ("Ver mi historial (N)"); al abrirlo, una línea de tiempo por meses con los 5 guardados más recientes y "Ver más". Mismos datos y caché: abrir y cerrar no repite llamadas.

### Cambiado

- Código en inglés en un pase completo: módulos `cuentas` → `accounts`, `consentimiento` → `consent`, `bienestar` → `wellbeing`, `notificaciones` → `notifications`; ~60 archivos renombrados (`IniciarSesion` → `LogIn`, `OtorgarConsentimiento` → `GrantConsent`, `RolUsuario` → `UserRole`…) y ~750 identificadores (`obtenerAppContext` → `getAppContext`…). Hecho con el servicio de lenguaje de TypeScript, que cambia cada referencia y rechaza un nombre que choque con otro ya visible. Sin cambios de comportamiento: 419 tests, E2E con base de datos local y `check:api` en verde.
- Se quedan en español a propósito: columnas de la base de datos, claves de categoría, claves y variables de i18n, la cookie `sesion` y los campos JSON de la API (ver AGENTS.md).
- Los campos del log estructurado pasan a inglés: `level`, `message`, `route`, `userId`.
- E2E con `api/` en GitHub Actions solo en las PRs a `main` (entregas a producción) hasta final de octubre; a mano desde la pestaña *Actions* cuando se quiera.

### Añadido (documentación)

- `docs/README.md`: mapa de toda la documentación (una línea por documento), recorrido de 20 minutos y reglas para que no crezca sin control.
- Aviso al principio de los 5 diagramas de análisis: son el modelo conceptual de septiembre, no el diseño actual, con la equivalencia de nombres.

### Eliminado

- `src/modules/recomendaciones/`: carpeta vacía, duplicada de `recommendations/`.
- Esqueletos vacíos de módulo (`notifications/`, capas vacías de `panel/` y `wellbeing/`) y los `.gitkeep` de carpetas que ya tienen código.
- Los apartados "Próximo paso" de 15 documentos (eran notas de la conversación de trabajo; lo pendiente vive en el tablero). Los dos con contenido propio pasan al tablero: la validación ética con el tutor (RF-29/RES-09) y la idea de `requestId` en los logs. El de ADR-02 era una regla de uso y pasa a llamarse "Mantenimiento".

## [1.0.1] - 2026-09-29

### Corregido

- En producción, recargar cualquier página que no fuera la portada (o abrir un enlace directo, como el del correo de recuperar contraseña) daba 404: Vercel no sabía que esas rutas son de la app. `vercel.json` reescribe a `index.html` las rutas sin extensión que no son de `api/` (ni de Vite en `vercel dev`).

### Añadido

- `npm run smoke:prod` (`scripts/smoke-prod.mjs`): comprueba un despliegue real sin crear datos (portada, rutas de la app al recargar, funciones en Dublín, conexión con Supabase, 404 en `api/` inexistente).
- Workflow **Smoke producción**: lo ejecuta automáticamente tras cada despliegue de producción de Vercel.

## [1.0.0] - 2026-09-29

Primera entrega a producción (`main`): cierre del Ciclo 1 (MVP). Reúne todo lo fusionado en `develop` desde la 0.1.0.

### Añadido

- **RF-04** — módulo `consentimiento` (dominio + aplicación): entidad `Consentimiento`, casos de uso `OtorgarConsentimiento`/`VerificarConsentimiento`. Idempotente por versión de política. Cierra el Sprint 1; disparador real y persistencia Supabase llegan con RF-06/RF-07 (ver más abajo).
- **RNF-13** — roles de usuario (`usuario`/`premium`/`admin`) en `UsuarioAutenticado`, guardados en `app_metadata` de Supabase (no autoasignable por el propio usuario). Base para el futuro rol de administrador y para RN-11 (premium).
- **RF-03** — perfil de usuario (nombre, fecha de nacimiento, género opcional, zona horaria): entidad `Profile`, casos de uso `UpdateProfile`/`GetProfile` (upsert parcial), adaptador en memoria, vista `ProfileForm` (mobile-first, con precarga, selector de fecha nativo) y endpoint `api/accounts/profile.ts`. `name` se captura ya en el registro (RF-01), no aquí.
- `ProtectedLayout` (`shared/ui/`): envoltorio común a las pantallas protegidas (`Header` + breadcrumbs opcionales), usado ahora por `Home` y la nueva pantalla de perfil.
- Enlace a `/perfil` en el `Header`, que ahora muestra `name` (con el email como reserva) vía `/api/accounts/session` — sin llamada aparte a `/api/accounts/profile`.
- Filosofía mobile-first adoptada para todo el frontend (RNF-06 ampliado).
- **RF-06/RF-07** — catálogo de 9 categorías estándar (módulo `categories`), sembrado por usuario en el primer `ListCategories`; `ActivateCategory`/`DeactivateCategory` sobre `CategoryRepository` (Supabase real desde el principio). Activar una categoría sensible sin consentimiento devuelve `ConsentRequiredError` (nuevo en la jerarquía `DomainError`) — el frontend muestra un modal que llama al primer endpoint real de RF-04 (`api/consent/grant.ts`) y reintenta. Vista `CategoriesPage`, endpoints `api/categories/index.ts`, `api/categories/activate.ts`, `api/categories/deactivate.ts`.
- **RF-10** — entrevista personal (los requisitos la llaman check-in): módulo `assessments` (`Score` 1-10, `Assessment` inmutable, `RecordAssessments` todo o nada con nota opcional), persistencia Supabase desde el principio (`supabase/migrations/0004_assessments.sql`), endpoint `api/assessments` (POST guarda, GET devuelve la última puntuación por categoría vía `GetLatestScores`), pantalla `/perfil/entrevista` (conversación con avatares por defecto, elegir categorías + "Seleccionar todas", puntuación parcial, botones 1-10 sin valor por defecto oculto) y `/perfil/resultados` (tarjetas con color por banda: rojo/naranja/amarillo/verde, suaves y siempre con número y texto). Sin periodos (RF-09) ni recomendaciones (RF-18) todavía.
- Plan de métricas DORA y Flow para la revisión de calidad ([02_Metricas_DORA_y_Flujo.md](docs/project-management/02_Metricas_DORA_y_Flujo.md)); solo planificación.
- `PrivacyPolicyPage` (`/politica-privacidad`, pública, RNF-05): antes del modal de consentimiento no había nada real que leer. Enlazada desde el modal; muestra la misma `VERSION_POLITICA_ACTUAL` que valida el backend. Contenido de borrador razonable para un TFM, no redactado por asesoría legal.

### Añadido (RNF-10)

- Selector de idioma en las páginas públicas (portada, registro, login, recuperar contraseña, política): `LanguageSwitcher` compartido con la cabecera y nuevo `PublicLayout`. El botón se nombra en el idioma de destino ("English"/"Español"). Test E2E: se cambia a inglés en la portada y la elección se recuerda tras recargar.

### Añadido (ADM-02, multidioma)

- El admin crea las categorías con nombre y descripción en **cada idioma soportado** (hoy español e inglés, todos obligatorios; ningún nombre se repite en ningún idioma). Los textos viven en la nueva tabla `category_translations` (una fila por categoría e idioma) y la interfaz los resuelve **por id de catálogo** (`GET /api/categories/translations`, `useCategoryLabel`), en entrevista, historial, Resultados, evolución, radar y recomendaciones. Mismo modelo para las 9 estándar y las del admin. Lista de idiomas en un único sitio (`shared/domain/locales.ts`); el formulario y la tabla del admin se generan a partir de ella. `AdminCategories` reescrito con identificadores en inglés.
- `supabase/migrations/0009_category_translations_table.sql`: tabla `category_translations`, `category_catalog.key` (clave estable de las estándar, usada por ejemplos y recomendaciones en lugar del nombre) y `categories.catalog_id` (FK, en lugar de emparejar por nombre). Migra los datos de la 0008 y borra sus columnas; repetible.

### Cambiado (ADM-02)

- Sustituido el primer planteamiento bilingüe (columnas `name_en`/`description_en` de la migración 0008 y campos `nameEn`/`categoryNameEn` en los DTO): no escalaba a más idiomas. Eliminadas también las claves i18n `categoriasEstandar.*`.

### Corregido (RNF-10)

- El despliegue de la PR fallaba en `npm run build`: el caso de uso ya exigía los campos en inglés pero `api/admin/categories` no los aceptaba (trabajo que había quedado a medias). Corregido y comprobado con `npm run build` y `npm run check:api`.

- Los nombres y descripciones de las categorías estándar salían en español con la interfaz en inglés (vienen de la base de datos). Ahora se traducen al mostrarlos en entrevista, historial, Resultados, tarjetas de evolución, radar y recomendaciones (primero con claves `categoriasEstandar.*`; después con el modelo por id descrito en ADM-02, multidioma). La lista de ejemplos de la entrevista usa la `key` de la categoría (se elimina el `EXAMPLES_KEY` duplicado).

- `<html lang>` fijo en `en` con la app en español: ahora sigue al idioma elegido (lectores de pantalla).

### Añadido (gestión)

- Guion de la demo de cierre ([04_Guion_Demo_Cierre.md](docs/validation/04_Guion_Demo_Cierre.md)): preparación de la primera entrega a producción, demo de 25 minutos, preguntas probables. `E2E_VIDEO=1 npm run test:e2e:api` graba un vídeo de cada test (plan B de la demo).
- `scripts/sql/simulated-history.sql`: historial simulado de 12 meses para un usuario (una entrevista al mes, solo en sus categorías activas, antes de su primera respuesta real y enlazando con su puntuación actual), para ver la evolución y el radar en desarrollo y en la demo. Repetible y reversible (marca en los microsegundos de `recorded_at`). Probado sobre las 9 migraciones con PGlite.
- Primera revisión de métricas DORA y Flow ([02_Metricas_DORA_y_Flujo.md](docs/project-management/02_Metricas_DORA_y_Flujo.md) apartado 7) y dos reglas de flujo nuevas en el tablero.

### Añadido (verificación y documentación)

- Workflow de GitHub Actions **E2E con api** (`.github/workflows/e2e-api.yml`): en cada PR levanta un Supabase local y ejecuta `npm run test:e2e:api`; guarda el informe HTML como artefacto. Sin secretos: nunca toca la base real.
- `npm run dev:local`: la app completa contra el Supabase local (http://localhost:5175), sin cuentas ni `.env`. Lógica común con `test:e2e:api` en `scripts/local-supabase.mjs`; `vite.e2e.config.ts` pasa a `vite.local.config.ts`.
- `README.md` reescrito (era la plantilla de Vite): qué es la app, cómo probarla en local, cómo entrar como administrador, tests y cómo verlos funcionar.
- Plan de verificación, apartado 1.2.1 "Cómo ver que funciona".

### Cambiado (documentación)

- Referencias a apartados escritas con la palabra ("ADR-03, apartado 6.1") en lugar del símbolo de sección, en todo el repositorio.
- Numeración de apartados: "1bis/1ter/2bis/6bis/7bis/7ter" pasan a subapartados decimales (1.1, 1.2, 2.1, 6.1, 5.1, 6.1) en ADR-03, ADR-04, ADR-06, ADR-09 y el plan de verificación, con las referencias actualizadas en 29 archivos.

### Añadido (verificación)

- `npm run test:e2e:api`: tests E2E con `api/` contra un Supabase local en Docker (`supabase/config.toml`; la base se vacía y se reaplican las migraciones en cada ejecución). Servidor propio en Vite (`e2e/support/apiDevServer.ts`, rutas como Vercel, probado con Vitest) que se niega a arrancar si la base no es local y aísla la memoria de cada petición. Page Objects en `e2e/api/pages/`; 9 tests en móvil y escritorio (registro, login, cerrar sesión, consentimiento, entrevista, panel, idea, exportar y eliminar la cuenta).

### Corregido (despliegue)

- E2E con `api/` en GitHub Actions: el test de contraseña incorrecta fallaba en móvil (solo en CI, más lento). El Page Object elegía el menú móvil o el botón de escritorio con `isVisible()`, que no espera; ahora decide por el ancho de pantalla. Comprobado con 90 repeticiones en paralelo.

- Login, registro y el resto de la API devolvían 500 en la *preview* de Vercel: `Cannot find module …/http/router`. Las funciones corren como ESM nativo de Node, que no resuelve imports relativos sin extensión, y ni los tipos (`bundler`) ni `vercel dev` lo detectaban. Imports con `.js` en todo lo alcanzable desde `api/`, `api/tsconfig.json` en `nodenext`, y `npm run check:api` (también en el pre-push) comprueba ahora los archivos de `src/` que `api/` alcanza y carga cada función en Node.

### Cambiado (rendimiento y móvil)

- Iconos de `@mui/icons-material` (importados por ruta) en lugar de cinco SVG copiados a mano; sin cambio de tamaño en el paquete.

- Funciones de Vercel en Dublín (`vercel.json`, `"regions": ["dub1"]`), junto a la base de datos de Supabase (Irlanda); antes corrían en Washington y cada consulta cruzaba el Atlántico.
- **UX-03** — cabecera en móvil con menú (Inicio, Administración si es admin, Mi perfil, nombre, Cerrar sesión) en lugar de cinco botones; desde `sm`, sin cambios.
- Páginas públicas de cuenta con margen lateral en móvil y alineadas con las migas (`PublicFormBox`, sustituye 8 copias del mismo estilo).

### Añadido (calidad)

- Quality gates con Husky: `pre-commit` ejecuta lint y `typecheck`; `pre-push` ejecuta `npm run verify` (lint, tests con cobertura, build, `check:api` y e2e). Cobertura con `@vitest/coverage-v8` y umbral solo sobre la lógica de negocio (dominio + aplicación: 90/80/95/95; medido 95/87/99/98). Nuevos scripts `typecheck`, `test:coverage`, `verify`.

### Añadido (UX-02, destacar las propuestas)

- Cada tarjeta del panel escribe la banda de su puntuación ("Bajo", "Casi bajo", "Medio", "Bueno") junto al número, con los mismos textos que Resultados (`BAND_LABEL_KEYS` en `scoreBand.ts`, compartido).
- Resumen "Ideas para ti" arriba del panel (`IdeasSummary`) con un botón por recomendación abierta ("Idea para Economía"), que abre la misma ventana con el aviso de RES-05. `RecommendationButton` acepta una etiqueta opcional.

### Añadido (UX-01, guía de primer uso)

- "Cómo funciona" en tres pasos numerados (`HowItWorks`, `shared/ui/components/`) en la portada y en la bienvenida de Inicio de primera vez.
- La primera entrevista explica los pasos de la pantalla en la burbuja del entrevistador, con el nombre real del botón de guardar; al actualizar respuestas no se repiten.
- "Cómo leer esta página" en el panel (`DashboardGuide`): explica equilibrio, evolución, "Una idea para ti" y "Actualizar mis respuestas"; se cierra con "Entendido", se recuerda en `localStorage` (a salvo si el navegador lo bloquea) y se puede reabrir.

### Añadido (validación)

- Guion del test de usabilidad del MVP ([docs/validation/01_Guion_Test_Usabilidad.md](docs/validation/01_Guion_Test_Usabilidad.md)): preparación, cómo dirigir la sesión (pensar en voz alta, sesgo de cercanía), 8 tareas del flujo completo con lo que observar en cada una, SUS, preguntas sobre el tono (RN-04/RES-07) y regla de decisión por gravedad. Hoja de resultados lista para rellenar ([02_Resultados_Test_Usabilidad.md](docs/validation/02_Resultados_Test_Usabilidad.md)). Versión corta en inglés para la sesión real (~20 min, 5 tareas, 5 preguntas): [03_Short_Test_Script_EN.md](docs/validation/03_Short_Test_Script_EN.md).
- Resultados de la sesión de validación (27 sept.): RN-04 se cumple según lo declarado; un problema de gravedad 3 (guía de primer uso, corregido con UX-01); T5 no se intentó por decisión de la participante; tres ideas para el Ciclo 2.

### Añadido (RF-15)

- **RF-15** — radar de equilibrio ([historia](docs/user-stories/RF-15-radar-equilibrio.md)): tarjeta "Tu equilibrio" en Inicio, encima de la evolución, con la última puntuación de cada categoría activa y puntuada. Plantilla genérica `RadarChart` en `shared/ui/charts/RadarChart/` (reutiliza `useEChart`; modo compacto en móvil para que quepan nombres largos). Lógica en `assessments/ui/balance/` (`buildBalance`, `BalanceCard`): orden fijo del catálogo, escala 0-10, mínimo tres categorías, lista de las que faltan por puntuar, descripción textual y "Ver datos". Sin endpoint nuevo; carga diferida.

### Corregido (RF-15)

- `escapeHtml` para los tooltips de ECharts, que se pintan como HTML: los nombres de categoría (que puede crear el admin) ya no pueden inyectar HTML.
- Tests intermitentes con toda la batería en paralelo (flujo de consentimiento, gráficos diferidos de Inicio): espera asíncrona de Testing Library de 1 s a 3 s en `tests/setup.ts`.

### Añadido (infraestructura)

- `.github/workflows/supabase-keep-alive.yml`: una consulta diaria mínima (solo lectura, clave pública *anon*, sin permisos sobre el repositorio) para que Supabase Free no pause el proyecto por inactividad; si Supabase no responde 200, el job falla y GitHub avisa. Necesita los secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` y que la rama por defecto sea `develop` (ver ADR-03 apartado 6.1).

### Cambiado (estructura y nombres)

- Gráficos reorganizados como plantillas genéricas en `src/shared/ui/charts/`: `TimeLineChart` (configurable por props), `useEChart`, `echarts.ts`, `timeWindow.ts`, `ChartDataTable`. Lo específico de la evolución, en `assessments/ui/evolution/` (`EvolutionPanel`, `PeriodSelector`, `CategoryEvolutionCard`, `scoreHistory`). Inicio dividido en `panel/ui/home/` (`Home`, `FirstTimeWelcome`, `LoadErrorState`, `Dashboard`).
- Recomendaciones (RF-18): la nota en la tarjeta pasa a un botón destacado "Una idea para ti" que abre una ventana con la idea y el aviso de RES-05 (`RecommendationButton`; se elimina `RecommendationNote`).
- Identificadores en inglés en todo lo tocado: `InterviewPage` (≈60 nombres, p. ej. `borradores` → `draftScores`, estados `listo/guardando/guardado` → `idle/saving/saved`), `InterviewHistory`, `Header` (`onCerrarSesion` → `onLogout`), `ResultsPage`, `ScoreCards` (`resultados/extraFor` → `latestScores/renderCardExtra`) y sus tests. Renombrado con el servicio de lenguaje de TypeScript (solo identificadores reales, respetando el ámbito).

### Añadido (RF-16)

- **RF-16** — evolución temporal de cada categoría ([historia](docs/user-stories/RF-16-evolucion-temporal.md)), que cierra RN-03 (Must). En Inicio, `EvolutionCards` (dos columnas): una tarjeta por categoría activa con su puntuación actual y un gráfico de líneas con **Apache ECharts** (`CategoryTrendChart`; nueva dependencia `echarts`, importación por partes y carga diferida: ~175 kB comprimidos solo en Inicio). Eje 1-10 fijo y eje por meses con la misma ventana para todas las tarjetas, elegida con un selector 6 meses / 12 meses / Todo y flechas de periodo (6 meses por defecto en móvil). Tooltip con puntuación y fecha, descripción textual y tabla "Ver datos" como alternativa accesible. Lógica pura en `trendChart.ts` (`periodWindow`, `buildTrendOption`). `buildCategoryTimeSeries` transforma el historial existente (`GET /api/assessments/history`): sin endpoint nuevo, 10 de 12 funciones. Resultados conserva las tarjetas de detalle y se enlaza desde Inicio.

### Añadido (RF-14)

- **RF-14** — panel general en `/inicio` ([historia](docs/user-stories/RF-14-panel-general.md)): formaliza y cierra lo ya construido durante RF-18 — una tarjeta por categoría activa con su última puntuación, compuesta con su recomendación abierta si la hay. Sin caso de uso `ConsultarPanelGeneral` combinado en el servidor a propósito (ver "Nota de diseño" de la historia): se compone en `Home.tsx` a partir de `GetLatestScores` y `ListRecommendations`, ya independientes y cacheados. RF-15 (radar), RF-16 (evolución) y RF-17 (puntuación global) quedan fuera — RN-03 (evolución histórica) traza a RF-16, no a RF-14.

### Corregido (RF-14)

- `Home`: un fallo al cargar las puntuaciones se mostraba con el texto de bienvenida de "primera vez" ("Empecemos por conocerte"), confundiendo un error técnico con un usuario nuevo. Ahora tiene su propio estado, con aviso y botón para reintentar.

### Cambiado (RF-10 / RF-14 / RF-39)

- Entrevista: cada categoría activa sin responder lleva la etiqueta "Sin responder" (lila suave, sin tono de alarma) y hay una fila de accesos directos a cada pregunta; la pantalla se titula "Tu entrevista" solo la primera vez y "Actualiza tus respuestas" después. En Inicio y Resultados el acceso pasa de "Nueva entrevista"/"Hacer una entrevista" a "Actualizar mis respuestas" cuando ya hay respuestas.
- Colores planos en vez de degradados (bandas de puntuación y fondo de la entrevista); `BAND_GRADIENTS` eliminado.
- Cabecera: enlace "Inicio", a la izquierda de "Administración".

### Eliminado

- `panel.nuevaEntrevista` (i18n), sustituida por `entrevista.actualizarRespuestas`.

- `panel.descripcion` (i18n): texto residual del placeholder de `Home` anterior a RF-14 ("Tu panel llegará pronto…"), sin ningún uso ya en el código.

### Añadido (RF-18)

- **RF-18** — recomendaciones ([historia](docs/user-stories/RF-18-recomendaciones.md)). Módulo `recommendations`: entidad `Recommendation` (RD-04, estado ya modelado; solo se crea `pending`), catálogo curado de plantillas por categoría estándar (2 cada una) y generales de reserva para las que cree el admin, umbral por variable de entorno `RECOMMENDATION_THRESHOLD` (defecto 5), `GenerateRecommendations` (como mucho una abierta por categoría, rotación de plantillas) y `ListRecommendations` (solo mientras la categoría está activa y la puntuación sigue bajo el umbral). `RecordAssessments` avisa a un oyente opcional después de persistir (equivalente en proceso del evento de dominio, sin Outbox); un fallo se registra y no deshace el guardado. Tabla `recommendations` (`supabase/migrations/0007_recommendations.sql`), `GET /api/recommendations` (10 de 12 funciones), nota discreta "Una idea para ti" en las tarjetas de Inicio y Resultados con el aviso de RES-05 y textos ES/EN. Cubierta por RF-05: se exporta y se borra con la cuenta.

### Añadido (ADM-03)

- **ADM-03** — el admin gestiona cuentas de otros usuarios: cambiar rol, suspender/reactivar (bloqueo de Supabase + rechazo de sesiones abiertas), eliminar (reutiliza el borrado de RF-05, `EraseUser`), crear con contraseña temporal mostrada una sola vez, cambiar email/nombre y enviar enlace de recuperación. Las acciones sensibles piden la contraseña del propio admin; nadie cambia su rol, y no se suspende ni elimina a un administrador (siempre debe existir uno). Auditoría en la tabla `admin_audit_log` (`supabase/migrations/0006_admin_audit_log.sql`: solo inserción, sin datos personales), con los fallos de contraseña anotados; los 403 van al log operativo. Handlers en `src/shared/infrastructure/http/handlers/admin/` servidos desde `api/admin/[action].ts` (una función). `/admin` gana las pestañas Usuarios (rediseñada) y Auditoría. `ListUsers` incluye el nombre y si la cuenta está suspendida.

### Añadido (RF-05)

- **RF-05 / RNF-12** — exportar y eliminar mis datos ([historia](docs/user-stories/RF-05-exportar-eliminar-datos.md)). `ExportUserData` devuelve un JSON descargable (cuenta, perfil, categorías, consentimientos y evaluaciones con nombres, fecha y versión del formato); `DeleteAccount` exige la contraseña (comprobada en el servidor con el email de la sesión), borra evaluaciones → categorías → consentimientos → perfil y por último la cuenta de acceso (repetible si algo falla), y borra la cookie. Nuevos métodos en los puertos: `deleteByUserId` (evaluaciones, categorías, perfil), `buscarPorUsuario`/`eliminarPorUsuario` (consentimientos), `eliminarUsuario` (`AuthProvider`). Acciones `export-data` y `delete-account` en `api/accounts/[action].ts` (sin funciones nuevas). Pantalla `/perfil/datos` ("Privacidad y datos") con cuadro de confirmación. El derecho al olvido prevalece sobre la inmutabilidad de RF-12. El único administrador no puede eliminar su cuenta (409, mensaje propio): siempre debe existir uno; se comprueba en el caso de uso antes de pedir la contraseña.

### Añadido (panel de administración)

- `npm run check:api` (`scripts/check-api-types.mjs`): compila `api/` como lo hace Vercel (config leída sin `extends`, `nodenext` por defecto), para detectar antes de subir el fallo de despliegue de `api/tsconfig.json`.
- **ADM-02** — catálogo global de categorías gestionable por el admin: tabla `category_catalog` (`supabase/migrations/0005_category_catalog.sql`, con las 9 estándar), casos de uso `ListCatalog`/`AddCatalogCategory`/`RetireCatalogCategory`, endpoints `api/admin/categories` y `api/admin/categories/retire`, pestaña "Categorías" en `/admin`. Añadir: la categoría llega inactiva a todos los usuarios al listar (`ListCategories` ahora sincroniza con el catálogo). Retirar: se marca `retired_at` (no se borra), se desactiva en todos los usuarios, `ActivateCategory` la rechaza y las puntuaciones guardadas se conservan. `requireAdmin` compartido (`shared/domain/Actor.ts`); `ForbiddenError` → 403.

- **ADM-01 (propuesto)** — primer corte: `/admin` y `GET /api/admin/users` (lista de usuarios: email, rol, alta, último acceso) solo para `admin`. El rol se lee de la sesión verificada en el servidor; `ListUsers` lo vuelve a comprobar (`ForbiddenError` → 403) y la interfaz (enlace en el `Header`, `AdminRoute`) es solo comodidad. Sin datos de contenido de los usuarios. `SessionContext` expone `rol`.

### Cambiado

- Rendimiento percibido: caché de lecturas con `@tanstack/react-query` (categorías, últimas puntuaciones e historial: volver a una pantalla ya no repite las llamadas), marcar/desmarcar categorías no sensibles es optimista (se deshace si falla; las sensibles muestran un indicador), y `ProtectedRoute` pasa a ruta de diseño para que la sesión se consulte una sola vez y no en cada cambio de pantalla. Al guardar la entrevista, Resultados/Inicio se actualizan al instante. La caché no caduca por tiempo (solo se vuelve a pedir tras una acción que cambie esos datos o al recargar), se vacía al iniciar sesión/registrarse y también cubre el perfil y el panel de administración (usuarios y catálogo).

- Registro (RF-01): tras crear la cuenta el servidor deja la sesión iniciada (`cookieDeSesion` compartida con el login) y el usuario va directo a `/inicio`; si el inicio de sesión fallara, se muestra el mensaje anterior con enlace a `/login`.
- Entrevista (RF-10): categorías en dos columnas (las sensibles aparte, con explicación del consentimiento; "Seleccionar todas" solo afecta a la otra) y aside con el historial de cambios (`GetAssessmentHistory`, `GET /api/assessments/history`: cada guardado con "antes → ahora").

- Entrevista editable: ya no hay que "hacer una entrevista nueva". Muestra las categorías activas con su última puntuación precargada; cambiar una puntuación inserta un registro nuevo (RF-12: nada se sobrescribe); marcar/desmarcar categorías las activa/desactiva (esto cubre la interfaz de desactivación que se había quitado).

- Entrevista (RF-10): las categorías se eligen y activan dentro de la propia entrevista (se elimina `CategoriesPage` y la ruta `/perfil/categorias`; el modal de consentimiento se traslada); icono de ejemplos por pregunta (desplegable en línea, textos ES/EN); los números dejan de colorearse y la respuesta recibe un degradado de fondo suave animado por banda (`BandBackground`, respeta `prefers-reduced-motion`). **Pendiente:** interfaz para desactivar categorías.
- `Home` (`/inicio`): primera vez (sin puntuaciones) → bienvenida con enlace grande a la entrevista; usuario recurrente → panel con tarjetas de resultados (adelanto de RF-14).

- `useSesion` se mueve de `modules/cuentas/ui/` a `shared/ui/` para que `ProtectedLayout` pueda usarlo sin invertir la dirección de dependencia entre `shared` y los módulos.
- Código y nombres de archivo en inglés a partir de ahora (comentarios/docs siguen en español) — aplicado a todo lo tocado en RF-03: `RegistrarUsuario`→`RegisterUser`, `RegistroForm`→`RegisterForm`, `Perfil`→`Profile`, `ConfigurarPerfil`→`UpdateProfile`, `ObtenerPerfil`→`GetProfile`, `LayoutProtegido`→`ProtectedLayout`, `api/registro.ts`→`api/register.ts`, `api/configurar-perfil.ts`→`api/profile.ts` (y, más tarde el 15 sept., toda la carpeta `api/` se reorganiza en subcarpetas — ver más abajo). El resto del código existente (no tocado en este cambio) se renombra cuando se toque, no en un pase retroactivo — ver AGENTS.md.
- `edad` (entero) sustituida por `birthDate` (fecha, selector nativo `<input type="date">`).
- `api/` reorganizado en subcarpetas por capacidad de negocio (`accounts/`, `categories/`, `consent/`), reflejando la estructura de `src/modules/` — Vercel sí soporta rutas anidadas de forma nativa (carpeta → segmento de URL); la duda sobre esto venía de un incidente anterior ya resuelto por otra causa (`SUPABASE_URL` mal configurada, ADR-06 apartado 2), no de un problema real con anidar carpetas. URLs afectadas: `/api/register`→`/api/accounts/register`, `/api/login`→`/api/accounts/login`, `/api/logout`→`/api/accounts/logout`, `/api/sesion`→`/api/accounts/session`, `/api/solicitar-recuperacion`→`/api/accounts/request-password-reset`, `/api/restablecer-password`→`/api/accounts/reset-password`, `/api/profile`→`/api/accounts/profile`, `/api/activate-category`→`/api/categories/activate`, `/api/deactivate-category`→`/api/categories/deactivate`, `/api/grant-consent`→`/api/consent/grant` (`/api/categories` sin cambios).
- Header consolidado: "Perfil" y "Categorías" eran dos enlaces sueltos, ahora es uno solo ("Mi perfil") hacia `AccountPage`, con un menú lateral (cajón fijo en md+, desplegable en móvil) que sustituye a las pestañas: Perfil, Categorías, Entrevista y Resultados (rutas anidadas `/perfil/*`, recargables/enlazables).
- Metodología: se abandonan los sprints semanales por Lean + Kanban con apetito fijo y línea de corte ([00_Metodologia_Lean.md](docs/project-management/00_Metodologia_Lean.md)); el backlog pasa a ser un tablero Kanban. `docs/user-stories/` se mantiene plano (una historia por archivo, sin carpetas por sprint).
- Playwright instalado (`e2e/`, `npm run test:e2e`, `tsconfig.e2e.json`) — primer test cubre solo páginas públicas (no toca `api/`). Automatizar RF-01 (registro/login) queda pendiente de decidir cómo aislar los datos de prueba en Supabase.

### Corregido

- Despliegue en Vercel rechazado por el plan Hobby ("No more than 12 Serverless Functions"): había 16 archivos en `api/`. Los handlers de `accounts/*` y `categories/activate|deactivate` pasan a `src/shared/infrastructure/http/handlers/` y se despachan desde `api/accounts/[action].ts` y `api/categories/[action].ts` con un pequeño `createRouter` (con test); las URLs no cambian. Quedan 9 funciones. `npm run check:api` avisa si se superan 12.

- Despliegue en Vercel fallaba al compilar las funciones de `api/` (TS2591 y TS2835 en `api/categories/index.ts`): Vercel busca el `tsconfig.json` subiendo desde la función y solo encontraba el de la raíz, que no tiene opciones (solo referencias), así que aplicaba su valor por defecto `nodenext` — que exige extensiones en los imports relativos y no localiza los tipos de Node. Se añade `api/tsconfig.json` **autocontenido** (resolución `bundler`, `types: ["node"]`). Un primer intento con `"extends": "../tsconfig.api.json"` no funcionó: Vercel lee el archivo sin resolver `extends`, así que veía un `compilerOptions` vacío y seguía cayendo en `nodenext` (45 errores en todas las funciones). Reproducido en local imitando ese comportamiento y comprobado con la versión autocontenida (0 errores).

- `RegisterUser` no aislaba el guardado del perfil inicial (`updateProfile`) del alta en Supabase Auth: una excepción ahí habría reportado el registro entero como fallido pese a que la cuenta ya existiera. Ahora va en su propio try/catch, sin poder deshacer un registro ya válido.
- Bug real encontrado en pruebas manuales: tras guardar el perfil, el `Header` seguía mostrando el email en vez del nombre recién guardado. `useSesion` (hook independiente, sin forma de invalidarse) se sustituye por `SessionProvider`/`useSession` (contexto de React) — `RutaProtegida` (renombrada `ProtectedRoute`) instala un único contexto por ruta que `ProtectedLayout` y `ProfileForm` comparten, así `ProfileForm` puede pedir un `refresh()` tras guardar.
- Bug real más profundo, mismo síntoma: `ProfileRepository`/`ConsentimientoRepository` en memoria no sobreviven entre funciones serverless distintas de `api/` (cada archivo es una función aislada, sin memoria compartida — ni en producción ni en `vercel dev`). Se adelanta su persistencia real a Supabase (`SupabaseProfileRepository`, `SupabaseConsentimientoRepository`) desde ahora, no en el Sprint 5 como estaba planeado — ver [04_Almacenamiento_Datos.md](docs/architecture-decisions/04_Almacenamiento_Datos.md) apartado 5.1. Esquemas en `supabase/migrations/`.
- `api/accounts/session.ts` devolvía 500 (rompiendo la comprobación de sesión entera) si `getProfile` fallaba por cualquier motivo — p. ej. la tabla `profiles` sin migrar todavía. Aislado en su propio try/catch: un fallo ahí ahora solo significa "sin nombre todavía", nunca "no sé si hay sesión" (mismo criterio que `RegisterUser`).

## [0.1.0] - 2026-09-14

Primera entrega funcional del Ciclo 1 (MVP): Sprint 0 completo + Sprint 1 hasta la fecha (cuentas, navegación e i18n). Ver [01_Backlog_MVP.md](docs/project-management/01_Backlog_MVP.md) para el detalle por sprint.

### Añadido

- Estructura base del proyecto: Monolito Modular con Clean Architecture por módulo (`domain/`/`application`/`infrastructure`/`ui`), Composition Root (`container.ts`), Vitest + alias de módulo ([03_Arquitectura_Software.md](docs/architecture-decisions/03_Arquitectura_Software.md)).
- **RF-01** — registro e inicio de sesión sobre Supabase Auth, vía el puerto `AuthProvider` (`SupabaseAuthProvider` real, `InMemoryAuthProvider` para tests). Sesión en cookie `httpOnly` puesta por `api/login.ts` ([06_Autenticacion.md](docs/architecture-decisions/06_Autenticacion.md)).
- **RF-38** — recuperación de contraseña de extremo a extremo (`SolicitarRecuperacion`/`RestablecerPassword`), sin revelar nunca si un email existe.
- **RF-39** — routing real con React Router: Landing pública, Home protegida (`RutaProtegida` + `useSesion`), `api/sesion.ts` y `api/logout.ts`.
- **RF-30** — lógica de líneas de ayuda en crisis (`obtenerLineasAyudaCrisis`), lista para su colocación visual en una pantalla de ayuda futura.
- **RNF-10** — internacionalización ES/EN con `react-i18next`; todas las pantallas de cuentas traducidas, con selector manual de idioma en el `Header` ([09_Internacionalizacion.md](docs/architecture-decisions/09_Internacionalizacion.md)).
- `Breadcrumbs` y `Header` como componentes de navegación reutilizables en `shared/ui/` ([07_UI.md](docs/architecture-decisions/07_UI.md) apartado 5).
- Material UI como librería de interfaz, con tema explícito en modo claro.
- Observabilidad mínima: logger estructurado en JSON para los endpoints de `api/` ([08_Observabilidad.md](docs/architecture-decisions/08_Observabilidad.md)).

### Cambiado

- Almacenamiento y autenticación: de MongoDB Atlas a Supabase (Postgres + Auth gestionada) — decisión tomada antes de construir ningún adaptador real contra Mongo ([04_Almacenamiento_Datos.md](docs/architecture-decisions/04_Almacenamiento_Datos.md) v2.0).

### Corregido

- UI oscura no intencionada por falta de `ThemeProvider`/`CssBaseline` y `color-scheme: light dark` en conflicto con el tema.
- Fallo real en producción: los alias `@shared/@modules` no se resuelven dentro de `api/*.ts` (Vercel bundlea aparte de Vite) — todo el código alcanzable desde `api/` pasa a imports relativos.
- Tests de React sin limpieza entre casos (`tests/setup.ts` añade `afterEach(cleanup)`).

---

## Historial de cambios (de este archivo)

- **v1.0 (14 sept. 2026)** — se crea `CHANGELOG.md`, con la primera entrada `[0.1.0]` cubriendo todo el trabajo de Sprint 0 (resto) y Sprint 1 hasta la fecha, previo a su primera PR.
