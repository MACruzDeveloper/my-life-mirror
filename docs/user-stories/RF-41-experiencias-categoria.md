# Historia: Experiencias por categoría

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-41 (Should, Ciclo 2), RF-11 (nota), RF-40 (ideas con IA, la usará después), RES-09 (sin detección de riesgo), RN-04 (tono), petición de la validación (27 sept.) y plan del Ciclo 2 (29 sept.)

Como usuario que puntúa un área de su vida
Quiero contar qué me ayuda en ella y, si quiero, mi experiencia
Para que las ideas que me proponga la app encajen conmigo, sabiendo que lo que escribo es privado

## Alcance

- **"¿Qué te ayuda en esta área?"** bajo cada pregunta de la entrevista, plegado: entre 5 y 7 opciones para marcar, propias de cada categoría (p. ej. Deporte: caminar, gimnasio, deporte en equipo, naturaleza, bailar…). Se pueden marcar varias o ninguna. Se guardan al momento, como marcar una categoría: no esperan al "Guardar" de la categoría.
- **La nota pasa a "Tu experiencia (privada)"**, con un texto claro debajo: *solo la ves tú; nunca se envía a la IA ni se comparte con nadie*. Sigue guardándose con cada puntuación (RF-11), igual que ahora.
- **Para qué sirven:** las opciones marcadas son lo único que podrá usar la IA para personalizar ideas (RF-40), y solo si el usuario lo activa. Las de categorías sensibles se guardan igual, pero nunca se enviarán.
- **Solo las categorías estándar** (con clave) tienen opciones; las que crea el admin, de momento, no.
- **Derecho al olvido (RF-05):** las opciones salen en la exportación y se borran con las categorías.
- **Fuera de alcance:** que la IA las use (RF-40a), opciones para categorías del admin, añadir opciones propias.

## Criterios de aceptación

1. Given una categoría estándar activa en la entrevista
   When el usuario abre "¿Qué te ayuda en esta área?"
   Then ve las opciones de esa categoría y puede marcar y desmarcar varias

2. Given una opción marcada
   When vuelve a la entrevista más tarde (o recarga)
   Then la opción sigue marcada

3. Given el servidor rechaza el cambio
   When marca una opción
   Then la marca se deshace y se avisa

4. Given una opción que no es de esa categoría
   When llega al servidor
   Then se rechaza (400) y no se guarda nada

5. Given la entrevista
   When el usuario abre "Tu experiencia (privada)"
   Then ve el aviso de que solo la ve él y nunca se envía a la IA ni se comparte

6. Given opciones marcadas
   When exporta sus datos
   Then aparecen en su categoría

## Notas de diseño

- Opciones en el dominio (`categories/domain/experienceOptions.ts`), por clave de categoría; textos en i18n (`experiencias.<categoría>.<opción>`).
- Columna `categories.experience_tags text[]` (migración 0010), en la copia de cada usuario.
- `SetCategoryExperience` valida que cada opción es de su categoría; acción `experience` en `api/categories/[action].ts` (sin función nueva: 10/12).

## Historial de cambios

- **v1.0 (29 sept. 2026)** — versión inicial (PR 2 del plan del Ciclo 2).
- **v1.1 (3 oct. 2026)** — el botón de guardar pasa a ser uno por categoría (UX-05).
- **v1.2 (5 oct. 2026)** — el título pasa a "¿Qué te ayuda?" (más corto, para que quepa en móvil con su confirmación), con icono y flecha; "Tu experiencia (privada)" se cierra con su título o con la X (RF-42, v1.2).
- **v1.3 (5 oct. 2026)** — la nota ("Tu experiencia (privada)") pasa a ser el diario de experiencias de RF-44: varias, con su propio "Añadir" y borrables.
- **v1.4 (6 oct. 2026)** — revisión de código: guardar las opciones cambia solo su columna; antes se reescribía la fila y una petición casi simultánea de "¿Qué te lo pone difícil?" (o al revés) se perdía.
