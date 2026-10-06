# Historia: Líneas de ayuda siempre a mano (RF-30)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-30 (Should), RES-09 (sin detección de riesgo), RES-10 (los recursos de crisis son siempre reales), RES-05 (no es un servicio profesional), RF-44 (diario), RF-45 (sugerencias), RF-43 (experiencias compartidas), CAT-01 (contenido curado como datos).

Como cualquier persona que use la app (con cuenta o sin ella)
Quiero encontrar en todo momento a quién llamar si lo estoy pasando muy mal
Para pedir ayuda real sin tener que buscarla fuera

## Principio

**Ayuda ofrecida a todos, sin detectar nada (RES-09).** El enlace está siempre, en todas las pantallas, igual para todo el mundo: no aparece ni cambia por lo que alguien puntúe o escriba. Es la respuesta ética de la app a "¿y si alguien escribe que no puede más?", que el diario (RF-44), las sugerencias con IA (RF-45) y las experiencias compartidas (RF-43) dejaban pendiente.

## Alcance

- **Pantalla pública `/ayuda`**, "¿Necesitas ayuda ahora?", accesible con y sin sesión, con su cabecera y migas para salir: con sesión, la de la app (Inicio → Ayuda); sin ella, la de las páginas públicas (portada → Ayuda). El contenido no espera a saber si hay sesión:
  - en España: **024** (atención a la conducta suicida; gratuita, 24 horas) y **112** (emergencias), cada uno con un botón para llamar (`tel:`);
  - fuera de España: **Find A Helpline** (findahelpline.com), directorio internacional;
  - "Si hay un peligro inmediato, llama al 112";
  - que MyLifeMirror no es un servicio profesional ni de emergencias (RES-05), y que este enlace está siempre, para todo el mundo: no aparece por nada que hayas puntuado o escrito.
- **Enlace permanente y discreto** "¿Necesitas ayuda ahora?" al pie de todas las pantallas, públicas y protegidas.
- **Enlace junto a lo que escribe el usuario o lee de otros:** en el diario de experiencias (también cubre las sugerencias de la IA, que están dentro) y en la pestaña "De otras personas" de la ventana de ideas.
- **Datos reales y verificados (RES-10):** no se inventa ningún número. Solo España tiene líneas propias; para el resto, el directorio internacional. Las líneas pasan a `wellbeing/domain/catalog/helplines.json` (CAT-01: clave, país, teléfono o enlace) y sus textos a las traducciones, en español e inglés. Revisar periódicamente que siguen vigentes.
- **Sin servidor para las líneas:** son datos estáticos. La única llamada es la de la sesión, para elegir la cabecera.
- **Fuera de alcance:** elegir el país (se enseñan España y el directorio internacional a la vez), RF-29 (sugerir apoyo profesional por umbrales).

## Criterios de aceptación

1. Given cualquier pantalla, con o sin sesión
   When mira el pie de la página
   Then ve "¿Necesitas ayuda ahora?", que lleva a `/ayuda`

2. Given la pantalla de ayuda
   When la abre
   Then ve el 024 y el 112 con un botón para llamar, el enlace a Find A Helpline para fuera de España y el aviso de que la app no es un servicio profesional ni de emergencias

3. Given el diario de experiencias de una categoría o la pestaña "De otras personas"
   When los mira
   Then tiene a mano el enlace "¿Necesitas ayuda ahora?"

4. Given la app en inglés
   When abre la pantalla de ayuda
   Then todo está en inglés (los números no cambian)

5. Given el catálogo de líneas
   When se ejecutan los tests
   Then cada línea tiene teléfono o enlace y texto en los dos idiomas

## Historial de cambios

- **v1.0 (6 oct. 2026)** — versión inicial. La lógica (`getCrisisHelplines`) existía desde el Ciclo 1 sin pantalla.
- **v1.1 (6 oct. 2026)** — tras probarla el autor ("ahora no se puede salir de ahí"): cabecera y migas según haya sesión; el pie no enlaza a la propia ayuda.
