# Historia: Páginas de categoría y viajes en Aventura (RF-49)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-49 (Could), RN-04 (la nota la pone la persona), RF-44 (diario de experiencias), RF-05 (exportar y borrar), [plan de seguridad](../security/01_Plan_Seguridad.md) (recursos externos), decisión del autor del 14 oct.

Como persona que usa la app para mirarse
Quiero guardar lo que he vivido en una categoría, como los viajes que he hecho
Para recordarlo y que me motive, aunque no cambie cómo me va ahora

## Alcance

- **"Categorías" en la cabecera:** una pantalla con todas las categorías del catálogo en tarjetas. Cada tarjeta lleva a la página de su categoría. Por ahora solo Aventura tiene página; las demás se ven desactivadas, con "Próximamente".
- **La página de Aventura:** su descripción, tu última nota en ella (con enlace a la entrevista), tus experiencias del diario en Aventura y la sección **Tus viajes**.
- **Un viaje:** un país, elegido de una lista cerrada con búsqueda (o pulsándolo en el mapa), y un año, de 1900 a dos años vista (también un viaje que se está planeando). El mes es opcional: de un viaje antiguo basta con el año. **Sin texto libre.** Se puede borrar.
- **El mapa, a todo lo ancho:** los países visitados se pintan enteros en azul marino; al pasar por encima se ve el país y cuándo se fue. Zoom con la rueda del ratón, con los botones o con el teclado. Debajo, el formulario y la lista, de más reciente a más antiguo (también la forma de verlos sin el mapa).
- **Sin recursos externos:** el mapa usa Leaflet (licencia BSD) instalado en el proyecto, y las formas de los países (Natural Earth a escala 1:50 millones, paquete `world-atlas`, licencia ISC; convertidas con `topojson-client`, ISC) van dentro de la app y se cargan solo en esta página. No se piden teselas ni nada a otro servidor, y la política de contenido no cambia. Los nombres de los países los da el navegador (`Intl.DisplayNames`) en el idioma de la interfaz.
- **La lista de países** (`agenda/domain/catalog/countries.json`, 236) se generó una vez a partir de ese mapa (con `i18n-iso-countries`, MIT, solo para la conversión; no es dependencia del proyecto): todo país elegible se puede pintar. Quedan fuera las zonas del mapa sin código propio (Somalilandia, Chipre del Norte, territorios del océano Índico, glaciar de Siachen).
- **Los recuerdos no tocan la puntuación** (RN-04): un viaje de 2015 no dice nada de cómo te va hoy. Tampoco se envían a la IA ni se comparten.
- **Datos (RF-05):** los viajes se exportan y se borran con la cuenta.
- **Fuera de alcance:** subcategorías con nota propia; páginas de las demás categorías; ciudades (necesitarían un servicio externo de búsqueda o un catálogo de decenas de miles de lugares); fotos; editar un viaje (se borra y se crea otro).

## Criterios de aceptación

1. Given una persona con sesión
   When pulsa "Categorías" en la cabecera
   Then ve una tarjeta por categoría del catálogo; la de Aventura lleva a su página y las demás están desactivadas

2. Given la página de Aventura
   When se abre
   Then se ven su descripción, la última nota en Aventura (o una invitación a puntuarla), las experiencias del diario en Aventura y la sección "Tus viajes"

3. Given la sección "Tus viajes"
   When se elige un país, un año y, si se quiere, un mes, y se añade
   Then el país se pinta en el mapa y el viaje sale en la lista, también tras recargar, y ninguna puntuación cambia

4. Given un país que no está en la lista, un año fuera de rango o un mes que no existe
   When llega al servidor
   Then se rechaza

5. Given la página de Aventura
   When se abre el mapa
   Then no se hace ninguna petición a otro dominio

6. Given un viaje
   When se borra
   Then desaparece del mapa y de la lista

7. Given una persona que exporta sus datos o borra su cuenta
   When lo hace
   Then sus viajes salen en la exportación y desaparecen con la cuenta

## Historial de cambios

- **v1.0 (14 oct. 2026)** — versión inicial. El autor propuso añadir el marcador al guardar una experiencia de viaje; se descarta porque no queda claro para la persona y mezcla dos cosas: el diario habla de cómo te va ahora, y un viaje es un recuerdo de cualquier fecha. Los recuerdos van aparte, en la página de la categoría.
- **v1.1 (14 oct. 2026)** — tras probarlo el autor: un viaje a Myanmar acababa en África (la mira del mapa no llegaba a avisar de su posición y se guardaba la de partida). En lugar de arreglar la mira, un viaje pasa a ser un país de una lista y un año (mes opcional), sin título libre ni día exacto, y el mapa pinta el país entero: el lugar es siempre exacto. Con eso sobran las teselas de OpenStreetMap: el mapa va dentro de la app, sin recursos externos. Se quita `react-leaflet` (licencia Hippocratic 2.1, no estándar) y se usa Leaflet directamente. Mapa a todo lo ancho, zoom con la rueda del ratón y miga de pan con el nombre de la categoría. Migración 0030.
- **v1.2 (14 oct. 2026)** — el mapa a todo lo ancho, más bajo, sin atrapar el desplazamiento de la página: la rueda sola desplaza la página y avisa; el zoom se hace con Ctrl/⌘ + rueda o pellizcando, y en móvil el mapa se mueve con dos dedos. Zoom limitado entre el mundo entero y un país mediano. La pregunta de Aventura en la entrevista enlaza a su página.
- **v1.2 (16 oct. 2026)** — los hitos (retos superados en Aventura; carreras y marcas en una página nueva de Deporte), en su propia [historia](RF-49-hitos.md). Migración 0031.
- **v1.3 (16 oct. 2026)** — páginas de categoría como landings, a petición del autor: imagen de cabecera detrás del título (provisional hasta tener las de cada categoría), sin migas de pan, y dos bloques nuevos: "Para inspirarte" (tres vídeos de YouTube curados por el autor en `categories/domain/catalog/inspirationVideos.json`; miniatura y reproductor sin cookies al pulsar) y "De la comunidad" (las experiencias compartidas de RF-43 en esa categoría). Se descartaron eventos públicos y noticias (necesitan una fuente externa y caducan) y testimonios escritos a mano (serían falsos).
