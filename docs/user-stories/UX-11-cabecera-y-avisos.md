# Historia: Cabecera reorganizada y campana de avisos (UX-11)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-39 (cabecera), RF-47 (ideas con fecha), RF-48 (invitación tras un evento), UX-10 (categorías sin revisar), RF-13 y RF-22 (recordatorios y notificaciones: siguen sin correo ni notificaciones del sistema), RNF-10 (idiomas), decisión del autor del 14 oct.

Como persona que usa la app a menudo
Quiero ver de un vistazo lo que la app tiene para mí y llegar rápido a cada sitio
Para no tener que ir a Inicio a buscarlo

## Alcance

- **Navegación:** Inicio, Categorías y Entrevista.
- **La cuenta:** el avatar y el nombre abren un menú con Mi perfil, Administración (solo admin) y Cerrar sesión.
- **Idioma:** "ES | EN", como en la portada, sin banderas.
- **Campana de avisos**, a la derecha del todo y separada por una línea: reúne los avisos que la app ya daba en Inicio (revisar la nota tras un evento, ideas guardadas cuya fecha ha llegado, categorías sin revisar desde hace más de un mes). Un número cuenta los que aún no se han visto; al abrirla dejan de ser nuevos (se recuerda en el navegador). Cada aviso lleva a donde se resuelve.
- **Dentro de la app:** sin correo ni notificaciones del sistema (RF-22 sigue fuera de alcance).
- **Estilo:** los elementos de la cabecera ocupan toda su altura al pasar el ratón, sin esquinas redondeadas. En móvil: idioma, campana y un menú con todo lo demás.
- **Arquitectura:** la cabecera es compartida y no conoce los módulos; la campana la pone la ruta protegida (`HeaderExtrasProvider`).

## Criterios de aceptación

1. Given una persona con sesión
   When mira la cabecera
   Then ve Inicio, Categorías y Entrevista; y al pulsar su nombre, Mi perfil y Cerrar sesión (y Administración si es admin)

2. Given un evento con categorías cuyo día ha llegado, una idea guardada para hoy o una categoría sin revisar desde hace más de un mes
   When abre cualquier página
   Then la campana dice cuántos avisos nuevos hay; al abrirla los ve y el número desaparece, también al volver

3. Given ningún aviso
   When abre la campana
   Then lo dice
