---
name: imagenes-con-ia
description: Generar imágenes con IA para MyLifeMirror (avatares del catálogo de RF-26, ilustraciones o fotogramas para la portada) con el modelo local y el proceso de revisión del proyecto. Úsala siempre que se pida crear, regenerar, añadir o cambiar un avatar, una ilustración o cualquier imagen generada; al tocar `scripts/avatars/`, `public/avatars/` o `accounts/domain/catalog/avatars.json`; o cuando se pregunte por qué una imagen generada no coincide con lo pedido.
---

# Imágenes con IA

Cómo se generan imágenes en este proyecto: en el ordenador del autor, con un modelo de HuggingFace, y con una persona revisando al final. Esta guía recoge lo que funcionó y lo que no al hacer los doce avatares (RF-26). El porqué de cada decisión, con las imágenes de las pruebas, está en `docs/architecture-decisions/05_Fundamentos_IA.md`, apartado 4.1.1.

## Reglas que no se negocian

- **Nunca se genera una imagen a petición de un usuario de la app.** Todo es contenido hecho de antemano: un catálogo cerrado.
- **Nada llega a la app sin que el autor lo vea.** Tú generas candidatas y las enseñas; publicar es decisión suya. No ejecutes `publish` sin que diga cuáles.
- **Describe rasgos, no etiquetas.** Pelo, tono de piel, gafas, ropa. Nunca género, origen, religión, edad, profesión ni adjetivos que valoren el aspecto. Si el autor pide "un hombre rubio", escríbelo como "short blond hair, short blond beard" y cuéntale por qué.
- **Nada reconocible de obras o personas reales.** Una serie o una foto sirven como referencia de composición y ambiente, no para imitar personajes, actores o logotipos.
- **El gasto se avisa antes.** Las imágenes son gratis (locales). El paso de razonamiento usa la API de Anthropic: céntimos, pero necesita el visto bueno del autor cada vez que se retoma.
- **Di lo que ves, no lo que esperabas.** Mira cada imagen antes de describirla. El modelo falla a menudo y en silencio.

## Antes de tocar nada

- **Pregunta primero lo que no te han dicho.** Si el autor da solo una parte ("pelo largo castaño"), el resto (tono de piel, ropa) es un borrador tuyo: enséñaselo y deja que elija antes de generar. Mira qué hay ya en el catálogo para proponer lo que falta, no un quinto avatar parecido.
- **El tamaño del catálogo es parte del requisito.** La historia RF-26 y su test fijan doce. Sustituir un avatar es lo normal; añadir un decimotercero es cambiar el alcance: pídelo de forma expresa, y si se aprueba, actualiza la historia y el test a la vez. No cambies el número del test solo para que pase.
- **No escribas en el catálogo hasta tener la descripción aprobada.** Un borrador en `avatars.json` con el test retocado deja el repositorio a medias si el autor dice que no.
- **Una generación a la vez.** El modelo ocupa casi toda la memoria de un Mac de 16 GB: comprueba que no haya otra en marcha (`pgrep -fl generate_avatars`) antes de lanzar la tuya.

## El proceso, en cinco pasos

| Paso | Quién | Qué | Si falla |
|---|---|---|---|
| 1. Descripción | El autor (o tú, como borrador) | Rasgos visibles, en inglés, en `avatars.json` | — |
| 2. Lista de palabras | `npm run test` | `avatarBannedTerms.json` contra cada descripción | No se genera |
| 3. Razonamiento | Claude Haiku, por la API | Cuatro pasos y un veredicto: ¿la combinación de rasgos cae en un estereotipo? | No se genera; el motivo queda en `out/log.json` |
| 4. Imagen | SDXL base, en local | Una candidata por semilla | Se descarta |
| 5. Revisión | El autor | Hoja de contactos; publica las que elige | No llega a la app |

Los pasos 2 y 3 no se sustituyen entre sí: la lista ve palabras; el razonamiento ve combinaciones (pelo blanco + barba blanca + calva + chaqueta de punto = "abuelo bonachón", ninguna palabra prohibida). El razonamiento tampoco es infalible ni del todo consistente: por eso decide una persona.

## Órdenes

```bash
# Una vez por máquina: entorno propio, fuera del proyecto de Node y de Git.
python3 -m venv scripts/avatars/.venv
scripts/avatars/.venv/bin/pip install -r scripts/avatars/requirements.txt

# Ver los prompts sin enviar nada (sin red, sin clave, sin dependencias).
python3 scripts/avatars/generate_avatars.py check

# Generar: primero uno solo, para ver calidad y tiempo.
scripts/avatars/.venv/bin/python scripts/avatars/generate_avatars.py generate --only roundGlasses
scripts/avatars/.venv/bin/python scripts/avatars/generate_avatars.py generate            # todo el catálogo
scripts/avatars/.venv/bin/python scripts/avatars/generate_avatars.py generate --seeds 12 7  # una candidata por semilla

# Publicar las que el autor elija: clave=semilla.
scripts/avatars/.venv/bin/python scripts/avatars/generate_avatars.py publish roundGlasses=12 longBraids=12
```

- Necesita `ANTHROPIC_API_KEY` en el `.env` (paso 3). Nunca imprimas la clave.
- La primera ejecución descarga el modelo (unos 7 GB). Cada imagen tarda unos 100 segundos en un Mac M3 de 16 GB: **lánzalo en segundo plano** y avisa de cuánto va a tardar.
- Las candidatas quedan en `scripts/avatars/out/` como `<clave>-<semilla>.webp`, con `review.html` (la hoja para el autor) y `log.json` (prompts, semillas y razonamientos). Todo eso está fuera de Git.
- En zsh, una variable con varias palabras no se separa sola: `publish ${=keys}`.

## Cómo escribir el prompt

Lo aprendido con SDXL, a base de pruebas:

- **Modelo normal, no "turbo".** SDXL-Turbo dibujaba a todo el mundo con piel clara, se pidiera lo que se pidiera (seis variantes del prompt, ninguna lo corrigió). SDXL base, con guía 7,5 y 28 pasos, sí respeta el tono. Es más lento; es el precio.
- **El tono de piel, lo primero de la descripción.** `dark brown skin, short curly hair…` funciona; el mismo rasgo al final, no siempre. "Deep brown" no lo entiende: usa "dark brown".
- **Sin negaciones en la descripción.** "No beard" hace que dibuje una barba. Lo que no debe aparecer va en el campo `avoid` del catálogo, que pasa al prompt negativo.
- **77 tokens por lector de texto.** SDXL corta en silencio lo que sobra; si el aviso "truncated because CLIP can only handle sequences up to 77 tokens" aparece en la salida, la segunda mitad del prompt no se ha leído. Acorta.
- **Dos lectores, y el segundo manda.** En `diffusers`, `prompt_2` pesa más que `prompt`. El sujeto va en `prompt_2` y el estilo en `prompt`; al revés, dibuja el escenario y deja a la persona diminuta.
- **El estilo depende de la semilla, no solo del texto.** La misma semilla para todo un catálogo lo deja uniforme (los avatares usan la 12). Otra semilla es otro estilo: sirve para explorar, no para mezclar.
- **No le pidas "la misma persona dos veces".** Cada figura le sale distinta. Si una escena lo necesita, compón por partes: genera una, voltéala, y redibuja la copia con imagen a imagen (`AutoPipelineForImage2Image.from_pipe`, fuerza 0,5).

## Escenas (más de una figura, una composición concreta)

El modelo local dibuja bien una figura con estilo; no sabe componer una escena exacta. Tras cinco tandas para la portada (ADR-05, apartado 4.1.2):

- **Divide el trabajo.** El modelo dibuja cada figura; un programa (PIL) hace lo demás: voltear, juntar las mitades, añadir una línea de luz, recortar al formato. Guarda cada mitad por separado: recomponer es instantáneo, regenerar son cinco minutos.
- **El modelo no obedece "mirando a la derecha".** Mira hacia dónde ha salido y voltea al componer.
- **Para cambiar un fondo plano,** rellena desde los bordes (`ImageDraw.floodfill`), no por color: la piel suele tener casi el mismo tono que el fondo y se la lleva.
- **Sé honesto con el límite.** Si tras dos o tres tandas no hay una imagen que convenza al autor, dilo: una herramienta externa puede resolverlo a la primera. Esa imagen pasa las mismas revisiones (nada reconocible de obras reales, y decir en la app que está generada con IA).
- **Las cabeceras de las páginas de categoría las genera el autor con ChatGPT** (plan gratuito, unos cinco intentos al día según él): composiciones de varias escenas que el modelo local no resuelve. Antes de usarlas, mira de cerca guantes, ropa, pantallas y vehículos buscando **logotipos y marcas**: la primera de Deporte traía UFC, Roland Garros, Red Bull y Nike. Si quedan pocos y pequeños, se tapan con PIL rellenándolos con el color de la tela de alrededor (difuminarlos se nota, y el autor lo descartó); si son muchos, se pide otra. Si algo recuerda a una marca sin logotipo (colores de un coche), un disclaimer al pie (`resemblesBrands` en `categoryHeroes.ts`). Dos tamaños en WebP (1672 y 828 px) en `src/assets/categories/`, y se enlazan en `categoryHeroes.ts`.
- **Antes de usar una imagen de fuera, mírala buscando elementos de su referencia.** La de la portada llevaba un dispositivo en la sien copiado de un cartel de una serie; se quitó.

## Revisar antes de enseñar

Abre la imagen (no te fíes del nombre del archivo ni del prompt) y comprueba:

- ¿Coincide con la descripción? Apunta cada diferencia: tono de piel, pelo, prendas, accesorios.
- ¿Ha añadido algo que no se pidió? Sobre todo prendas en la cabeza o con significado cultural o religioso.
- ¿Algún rasgo exagerado o caricaturesco? ¿Manos, ojos o texto raros?
- ¿El estilo es el del resto del conjunto?
- ¿El conjunto sigue siendo variado, sin que ninguno sea "el distinto"?

Preséntaselo al autor en una tabla: lo pedido, lo que ha salido y tu valoración (fiel, aceptable, no vale). Separa lo que es un fallo del modelo de lo que es un fallo tuyo.

## Publicar

`publish` copia la imagen a `public/avatars/<clave>.webp` (256 px) y pone `published: true` en el catálogo. Después:

1. **La clave y el texto alternativo describen lo que se ve**, no lo que se pidió. Si pedías un audífono y no sale, el avatar no puede llamarse `hearingAid` ni decir "con un audífono visible". Renombrar una clave es gratis solo mientras nadie la tenga guardada en su perfil.
2. Texto alternativo en `es.json` y `en.json` (`avatares.descripciones.<clave>`), escrito mirando la imagen.
3. `npm run test`: comprueba que cada publicado tiene su imagen, su texto en los dos idiomas y ninguna palabra prohibida.
4. Mira el resultado en la app (selector de "Mi perfil", en móvil y escritorio) antes de darlo por hecho.

## Fallos ya cometidos, para no repetirlos

- **Dar por gratuita una API.** La de HuggingFace ya no lo es para esto; se comprobó tarde. Antes de proponer un servicio, verifica qué ofrece hoy.
- **Tratar una respuesta cortada como un rechazo.** Con poco espacio de respuesta, el razonamiento se cortaba antes del veredicto y 5 de 12 descripciones parecían rechazadas. El script distingue ahora "rechazada" de "sin terminar"; si ves varias rechazadas seguidas, lee el razonamiento antes de creértelo.
- **Anunciar un resultado antes de leerlo.** Se dijo "el filtro ha hecho su trabajo" de un rechazo que no lo era.
- **Prometer lo que un modelo no garantiza.** Ningún modelo, gratis o de pago, asegura un resultado. Lo que lo asegura es el proceso: varias candidatas y una persona que elige.

## Límites que el proyecto asume

Doce avatares fijos no representan a todo el mundo. Lo que cubriría ese objetivo es un avatar componible (piel, pelo, gafas y ropa por separado), con dibujos por piezas y sin IA generativa; está fuera de este proyecto. Dilo así si alguien pregunta, en vez de prometer más variedad con más imágenes.
