# Historia: Compartir a la vista y un mensaje al ir bien (UX-09)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-43 (compartir experiencias), UX-01 (cómo funciona), RN-04 y RES-09 (la app no valora a la persona), ADM-02 (categorías añadidas desde administración), [segunda prueba con una usuaria](../validation/02_Resultados_Test_Usabilidad.md) (12 oct.), decisiones del autor del 12 oct.

Como persona a la que una categoría le va bien
Quiero que la app lo reconozca y me enseñe que puedo compartir lo que me funciona
Para no pasar de largo lo que la usuaria de la prueba consideró lo mejor de la app

## Alcance

- **Todas las categorías no sensibles se pueden compartir**, también las añadidas desde administración. Fallo real de la prueba: en "Idiomas", con un 8, no aparecía ni el aviso ni el botón. Las categorías añadidas después de las nueve originales no tienen clave de catálogo, y la app las dejaba fuera sin decir nada. Ahora se agrupan por su identificador.
- **"Compartir de forma anónima" es un botón**, no un enlace de texto.
- **Se explica antes de llegar:** "Cómo funciona" (en la portada y en la bienvenida) tiene un cuarto paso sobre compartir lo que funciona y leer lo de otras personas.
- **Una sola palabra:** "categorías" en toda la interfaz. Antes se mezclaba con "áreas".
- **Un mensaje al guardar una puntuación de 8 o más**, en un aviso que se cierra solo a los 5 segundos o con su botón:

  | Caso | Mensaje |
  |---|---|
  | 8, o cualquier nota alta en una categoría sensible | Reconoce e invita: "Idiomas te va bien ahora. ¿Qué te está ayudando?" |
  | 9 o 10 en una categoría no sensible | Felicita con sobriedad: "Enhorabuena: un 10 en Aventura. ¿Qué te está ayudando?" |
  | Donde se puede compartir | Añade la invitación a compartirlo de forma anónima |

- **Por qué no felicitar siempre:** la app es "un espejo, no un examen" y sus reglas dicen que no pone nota a la persona. La felicitación es una excepción acotada, decidida por el autor: solo con 9 o 10 y nunca en categorías sensibles, donde un "enhorabuena" sobre la salud o la vida sexual de alguien está fuera de lugar.
- **Lo que hay que poder releer no desaparece:** la oferta de compartir sigue además en la pantalla, junto al diario. El aviso emergente es solo el reconocimiento.
- **Fuera de alcance:** mensajes para puntuaciones bajas (ya tienen su idea), notificaciones fuera de la app.

## Criterios de aceptación

1. Given una categoría añadida desde administración, no sensible, con un 8 guardado y una experiencia en el diario
   When se abre su diario
   Then aparecen la oferta y el botón de compartir, y otra persona con esa categoría lee la experiencia compartida

2. Given una categoría sensible, la haya añadido quien la haya añadido
   When se intenta compartir una experiencia suya
   Then no se puede

3. Given una puntuación de 8 recién guardada en una categoría no sensible
   When termina de guardarse
   Then un aviso reconoce el momento e invita a anotar o compartir, sin felicitar

4. Given un 9 o un 10 en una categoría no sensible
   When se guarda
   Then el aviso felicita con sobriedad

5. Given una nota alta en una categoría sensible
   When se guarda
   Then el aviso reconoce el momento, sin felicitar y sin invitar a compartir

6. Given el aviso en pantalla
   When pasan 5 segundos, o se pulsa "Cerrar"
   Then desaparece

7. Given la portada o la bienvenida
   When se lee "Cómo funciona"
   Then un paso explica que se puede compartir de forma anónima lo que funciona
