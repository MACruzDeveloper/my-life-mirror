# Historia: Vídeos de inspiración desde el panel de administración (ADM-04, primera parte)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** ADM-04 (contenido editable desde `/admin`, idea del tablero), [ADM-02](ADM-02-catalogo-categorias.md) (catálogo desde el panel), RF-49 (páginas de categoría, "Para inspirarte"), RNF-10 (i18n), decisión del autor del 17 oct.

Como administrador
Quiero añadir y quitar los vídeos de inspiración de cada categoría, en cada idioma, desde el panel
Para no tener que tocar el código ni desplegar para cambiarlos

## Por qué

Los vídeos de "Para inspirarte" vivían en un JSON del código: cambiar uno exigía editar el archivo y desplegar. Además, una persona que usa la app en español debería ver vídeos en español si los hay. Es la primera parte de ADM-04: el resto del contenido curado (ideas, opciones, situaciones) sigue en el código.

## Alcance

- **Pestaña "Vídeos"** en el panel de administración. Para añadir uno:
  - la **categoría** (de las estándar);
  - el **idioma** (español o inglés);
  - el **enlace de YouTube** o su identificador: se aceptan los enlaces habituales (`youtube.com/watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`) y se guarda solo el identificador;
  - el **título**, tal como se publicó y en su idioma, hasta 120 caracteres.
- **La lista:** tabla con categoría, idioma, título y el enlace a YouTube (con su icono), y los iconos de **editar** y **borrar** en cada fila. Se **filtra por categoría** y se **pagina** (5, 10 o 25 por página). Editar rellena el formulario con el vídeo y guarda con las mismas reglas.
- **Reglas:**
  - El mismo vídeo no se repite en la misma categoría e idioma.
  - Como mucho 6 por categoría e idioma en el panel.
- **En la página, como mucho 3** (una fila), los más recientes primero: un vídeo nuevo sustituye en la página al más antiguo, que sigue en el panel.
- **En la página de la categoría:** los del idioma de la interfaz; si no hay ninguno en ese idioma, los de otro. Cada uno lleva el icono de YouTube.
- **Solo administración:** sin sesión, 401; sin rol de administración, 403, que queda en el log. El rol sale de la sesión verificada en el servidor, nunca del cuerpo.
- **Datos:** tabla `inspiration_videos` (**migración 0033**), solo accesible desde el servidor, con los seis vídeos de ejemplo que había en el código. Va en las funciones que ya existen: `/api/admin/videos` y `/api/categories/videos`.
- **Seguridad:** el identificador se valida con su formato (11 caracteres de letras, números, `-` y `_`) antes de guardarlo y antes de construir ninguna dirección. La política de contenido no cambia.

## Criterios de aceptación

1. Given el panel de administración
   When se añade un vídeo a Deporte, en español, con su enlace de YouTube y su título
   Then aparece en la lista del panel y en la página de Deporte en español

2. Given un vídeo de Deporte solo en inglés
   When se abre la página en español
   Then se ve igualmente

3. Given un enlace que no es de YouTube, o el mismo vídeo ya añadido en esa categoría e idioma
   When se intenta añadir
   Then se rechaza con un mensaje y no se guarda

4. Given una persona sin rol de administración
   When llama a `/api/admin/videos`
   Then recibe 403 y queda en el log

5. Given un vídeo en la lista del panel
   When se borra con su icono
   Then deja de verse en la página de la categoría

6. Given un vídeo en la lista del panel
   When se edita su título
   Then la página de la categoría muestra el título nuevo
