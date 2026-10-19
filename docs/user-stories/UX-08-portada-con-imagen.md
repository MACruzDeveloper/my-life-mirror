# Historia: Portada con imagen (UX-08)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-39 (portada pública), UX-01 (cómo funciona, antes de tener cuenta), RNF-06 (móvil primero), [ADR-05](../architecture-decisions/05_Fundamentos_IA.md) apartado 4.1.2 (imágenes generadas), fase de mejoras (tablero), decisión del autor del 12 oct.

Como persona que llega por primera vez
Quiero entender de un vistazo de qué va la app
Para decidir si me quedo, antes de leer nada

## Alcance

- **Una imagen de fondo en la portada:** una persona frente a su reflejo, separados por una línea de luz. A un lado, en sombra fría y con gesto serio; al otro, en luz cálida y con una sonrisa tranquila. Es la idea del nombre de la app, sin texto.
- **Generada con IA por el autor**, con el generador de imágenes de ChatGPT, tras varias pruebas con el modelo local que no dieron una imagen suficiente (ADR-05, apartado 4.1.2). Se dice en la propia portada ("Imagen generada con IA").
- **Inspirada, no copiada:** el ambiente recuerda a Black Mirror y la idea de verse representado, a Los Sims, pero sin ningún elemento reconocible de esas obras. La primera versión llevaba un dispositivo luminoso en la sien, propio de la serie: se quitó.
- **Legible:** sobre la imagen va una capa oscura semitransparente; el título, la descripción y los botones se leen con contraste suficiente (WCAG AA).
- **Ligera:** dos tamaños en WebP (móvil y escritorio), servidos por la propia app; la política de contenido no cambia.
- **Decorativa para un lector de pantalla:** no aporta información que no esté en el texto, así que no se anuncia.
- **Primera vista a pantalla completa:** la imagen ocupa exactamente la pantalla, con el título, la descripción y los botones encima; el selector de idioma va sobre la imagen.
- **Al bajar, una segunda imagen:** "Cómo funciona" y el enlace a las líneas de ayuda no se ven al llegar; suben, en una tarjeta clara, sobre una segunda imagen de fondo. Las imágenes no se mueven y el contenido se desliza sobre ellas, como una cortina. Quien pide menos movimiento en su dispositivo ve la página desplazarse de forma normal.
- **Selector de idioma de texto:** en la portada, "ES | EN" con la etiqueta "Selecciona idioma", en lugar de las banderas, que sobre la imagen quedaban mal. En el resto de la app siguen las banderas.
- **Flecha para bajar:** un botón redondo de borde fino lleva a "Cómo funciona" con un desplazamiento suave (directo, para quien pide menos movimiento). Es un enlace: funciona con el teclado.
- **Las dos imágenes** son dos versiones de la misma escena con más fondo alrededor de las figuras, generadas por el autor; ninguna lleva ya el detalle de la serie.
- **Sin barra de desplazamiento a la vista** en la portada (decisión del autor): se sigue bajando con la rueda, el dedo, el teclado y la flecha. En el resto de la app la barra se ve.
- **El texto, abajo:** el título, la descripción, los botones y la flecha van en la parte baja de la pantalla, para que las figuras se vean enteras; la capa oscura es casi transparente arriba y más densa abajo, donde está el texto.
- **Al cerrar sesión se vuelve a la portada,** no al formulario de inicio de sesión.
- **Descartado:** una imagen de fondo también en Inicio. Se probó y no quedaba bien bajo el contenido.
- **Fuera de alcance por ahora:** el vídeo corto (las herramientas de imagen a vídeo probadas son de pago; queda como idea en el tablero). La portada se seguirá retocando.

## Criterios de aceptación

1. Given la portada, en móvil o en escritorio
   When se abre
   Then la imagen ocupa el fondo de la cabecera de la página, sin deformarse, y el título, la descripción y los dos botones se leen sobre ella

2. Given la portada
   When se mira el pie de la imagen
   Then dice que está generada con IA

3. Given un lector de pantalla
   When recorre la portada
   Then encuentra el título, la descripción y los botones como antes, y la imagen no se anuncia

4. Given la portada en un móvil
   When se carga
   Then se descargan las versiones pequeñas de las imágenes, no las de escritorio

5. Given la portada recién abierta
   When no se ha desplazado todavía
   Then la imagen ocupa exactamente la pantalla y "Cómo funciona" no se ve

6. Given la portada
   When se baja
   Then "Cómo funciona" aparece sobre la segunda imagen, y nada se sale de la pantalla a lo ancho
