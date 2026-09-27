# Historia: Guía de primer uso

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** [resultados de la validación](../validation/02_Resultados_Test_Usabilidad.md) (problema 1, gravedad 3: T1 y T2 necesitaron ayuda, "fácil de usar" 3/5), RN-04 (tono no punitivo), RNF-06 (móvil primero), RNF-10 (i18n), RF-39 (portada), RF-10 (entrevista), RF-14/RF-15/RF-16 (panel)

Como persona que abre la app por primera vez
Quiero entender qué voy a hacer y cómo se lee lo que la app me enseña
Para poder usarla sin que nadie me lo explique

## Alcance

Pistas breves en los tres momentos donde la participante necesitó ayuda. **Sin tutorial de pantallas seguidas**: se salta sin leer y retrasa llegar a lo importante.

- **Portada y bienvenida de primera vez:** un bloque "Cómo funciona" con tres pasos numerados (elige tus áreas → puntúa del 1 al 10, unos dos minutos → mira tu equilibrio, tu evolución e ideas). Es el mismo componente en los dos sitios: en la portada, antes de tener cuenta; en la bienvenida de Inicio, justo después de registrarse (el momento donde empezó a necesitar ayuda).
- **Entrevista, primera vez** (sin respuestas guardadas): la burbuja inicial del entrevistador añade los tres pasos concretos de la pantalla (marca las categorías → toca un número en cada una, puedes dejar alguna → pulsa "Guardar cambios"). Al actualizar respuestas no se muestran: ya los conoce.
- **Inicio con datos:** una tarjeta "Cómo leer esta página" encima del panel, que explica el equilibrio, la evolución, "Una idea para ti" y "Actualizar mis respuestas".
  - Se cierra con "Entendido" y no vuelve a aparecer sola en ese dispositivo (`localStorage`).
  - Un botón de texto "Cómo leer esta página" la vuelve a abrir cuando se quiera.
- **Tono (RN-04):** frases cortas, en segunda persona, sin imperativos de examen; "puedes dejar alguna para otro día".
- **Sin datos nuevos ni endpoint nuevo:** solo interfaz y textos (i18n, `es`/`en`).
- **Fuera de alcance:** tutorial interactivo con resaltado de elementos; recordar el cierre en el servidor (entre dispositivos); destacar las propuestas de la app (tarea aparte, gravedad 2).

## Criterios de aceptación

1. Given una persona sin cuenta
   When abre la portada
   Then ve "Cómo funciona" con tres pasos numerados, junto a los botones de crear cuenta e iniciar sesión

2. Given un usuario recién registrado, sin ninguna puntuación
   When llega a Inicio
   Then ve los mismos tres pasos junto al botón para empezar la entrevista

3. Given un usuario sin respuestas guardadas
   When abre la entrevista
   Then la primera burbuja del entrevistador incluye los pasos de la pantalla, con el nombre real del botón de guardar

4. Given un usuario con respuestas guardadas
   When abre la entrevista para actualizarlas
   Then no ve esos pasos

5. Given un usuario con puntuaciones que no ha cerrado la guía
   When llega a Inicio
   Then ve "Cómo leer esta página" con la explicación de cada parte del panel

6. Given la guía del panel
   When pulsa "Entendido"
   Then desaparece, y no vuelve a aparecer al volver a Inicio en ese dispositivo; un botón "Cómo leer esta página" la muestra otra vez

7. Given un navegador que no permite `localStorage` (modo privado estricto)
   When cierra la guía
   Then se cierra igualmente durante la visita, sin errores

## Notas de diseño

- `HowItWorks` en `src/shared/ui/components/`: lo usan una página pública (`pages/Landing`) y un módulo (`panel`).
- `DashboardGuide` en `src/modules/panel/ui/home/`, siguiendo la división del panel en subcomponentes.
- Los textos que nombran otros elementos ("Una idea para ti", "Actualizar mis respuestas", "Guardar cambios") los interpolan desde su propia clave: si un botón cambia de nombre, la guía no se queda desfasada.
- `localStorage` y no el perfil: es una preferencia de interfaz, sin valor para el usuario entre dispositivos; guardarla en el servidor costaría una columna y una llamada más.

## Historial de cambios

- **v1.0 (27 sept. 2026)** — versión inicial, a partir del problema 1 de la validación.
