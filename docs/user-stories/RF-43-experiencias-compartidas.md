# Historia: Compartir experiencias que funcionan (RF-43)

**Nivel:** 3 — Spec Source ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)): objetivo claro y desafío complejo (texto de un usuario que leen otros, sin moderador). Si algo cambia, se cambia **aquí** y después el código.
**Referencias:** RF-43 (Could, Ciclo 2; reescrito el 5 oct.), RF-44 (diario), RF-40 (ideas con IA), RF-18 (ideas), RF-05 (exportar y borrar), RES-05 (no es consejo profesional), RES-09 (sin detección de riesgo), RES-11 (privacidad entre usuarios), RF-32/RF-33 (funciones sociales con conexiones, siguen aparte), decisión del autor del 5 oct.

Como usuario al que le va bien en una categoría
Quiero compartir, de forma anónima, una experiencia que me ha funcionado
Para ayudar a otras personas a las que esa categoría les cuesta más

Como usuario que busca ideas
Quiero leer, junto a las ideas de la app, lo que les ha funcionado a otras personas
Para tener ejemplos reales, no solo sugerencias generales

## Principio

**Compartir es un acto altruista y voluntario, experiencia a experiencia.** Quien comparte decide ayudar a otros con algo que le ha ido bien. Por eso no hay agregados ni tamaño mínimo de grupo: el autor acepta que, por pura casualidad, alguien pudiera reconocerle por lo que cuenta. Lo que sí se protege es a quien lee: lo compartido pasa unos filtros antes de publicarse, y cualquiera puede reportarlo.

## Alcance

- **Compartir, desde el diario (RF-44):** en cada experiencia, "Compartir de forma anónima". Solo aparece si la última puntuación de esa categoría es **8 o más**, y nunca en categorías sensibles ni excluidas de la IA (Pareja: habla de una tercera persona). No hay interruptor general: cada experiencia se comparte por separado.
- **Vista previa antes de confirmar:** "Así la verán otras personas": el texto tal cual, sin nombre, fecha ni puntuación, con lo que implica: es anónima, se puede dejar de compartir cuando se quiera y otras personas pueden reportarla.
- **Filtros al compartir** (el diario privado sigue sin validarse): si el texto falla alguno, no se publica y se explica qué quitar (se borra y se escribe otra; las experiencias no se editan, RF-44):
  - datos de contacto (emails, teléfonos, enlaces, números largos): los mismos patrones que `redactPersonalData`;
  - lenguaje clínico, consejo profesional (terapia, medicación…) y consejo financiero: los grupos de `safetyTerms.json` que ya filtran las ideas de la IA. Es conservador a propósito: "ir a terapia me ayudó" tampoco se publica, porque la app no difunde consejo de salud ni financiero entre usuarios (RES-05);
  - insultos y términos ofensivos (`offensiveTerms.json`).
  No se filtran frases emocionales ("estaba fatal"): sería valorar a la persona (RES-09).
- **En el diario:** la compartida lleva "Compartida" y "Dejar de compartir"; la reportada, "Retirada tras un reporte" (ya no se puede volver a compartir; sí borrar). Si la puntuación baja después, sigue compartida: era una experiencia que funcionó.
- **Leer, en la ventana de ideas** (la de "Ideas para…" y la de "Cambios guardados"): pestañas cuando hay más de una fuente:
  - **"De la app"**: el carrusel de ideas curadas (UX-05);
  - **"Con IA"**: las mismas ideas personalizadas (RF-40), solo si el usuario las activó. Sustituye al enlace "Ver la idea original", porque la original está en la otra pestaña. Si está, es la pestaña que se abre primero (como hasta ahora); el carrusel va por la misma idea en las dos;
  - **"De otras personas (N)"**: hasta 10 experiencias compartidas de esa categoría (la misma del catálogo), en el idioma de la interfaz, nunca las propias ni las reportadas, la más reciente primero. Solo el texto. Cada una con "Reportar" y el aviso "Experiencia de otra persona: no es consejo profesional". Si no hay ninguna, la pestaña no aparece.
- **Reportar:** un reporte la oculta en el momento para todos, sin esperar a nadie (no hay moderador). Quien reporta ve "Gracias. La hemos ocultado".
- **Privacidad y datos:** la sección "Experiencias compartidas", con la lista y "Dejar de compartir" en cada una.
- **Datos:** columnas nuevas en `experiences` (migración 0017): `shared_at`, `shared_locale`, `shared_category_key` (la clave del catálogo, para buscar sin cruzar tablas) y `reported_at`. Borrar la experiencia o la cuenta borra lo compartido. La exportación (RF-05) dice qué experiencias están compartidas o retiradas.
- **API:** sin función nueva. `PATCH /api/categories/diary` comparte o deja de compartir; `/api/categories/shared` lista (GET) y reporta (POST), en el router de categorías.
- **Política de privacidad:** sección nueva.
- **Fuera de alcance:** editar lo compartido, contestar o valorar experiencias, saber quién las escribió o cuántas personas las han leído, moderación humana, traducirlas. Las funciones sociales con conexiones (RF-32/RF-33) siguen aparte.

## Salvaguardas

1. **Consentimiento explícito por experiencia**, con vista previa. Retirable siempre (diario o Privacidad y datos).
2. **Anonimato de lo publicado:** a quien lee solo le llega el texto; ni nombre, ni fecha, ni puntuación, ni id de usuario. Se cumple RES-11: no se expone ningún dato que el autor no haya decidido compartir.
3. **Filtros deterministas antes de publicar** (contacto, salud y finanzas, ofensivos), con el motivo para el autor.
4. **Reporte que oculta al momento**, sin moderador, y la experiencia reportada no se puede volver a publicar.
5. **Sin detección de riesgo (RES-09):** no se valora a nadie por lo que escribe. Ante el contenido difícil, la respuesta es el enlace a las líneas de ayuda para todos (RF-30).
6. **Aviso en cada experiencia leída:** no es consejo profesional (RES-05).

## Contratos

```
ExperienceDto += { shared: boolean, reported: boolean }

checkShareableText(text) → { ok: true } | { ok: false, reason: "contact" | "health" | "offensive" }

ShareExperience({ userId, experienceId, locale }) →
  Ok(Experience)                        // compartida (repetible: si ya lo estaba, se queda igual)
  | Err(NotFound)                       si no existe o no es del usuario
  | Err(Validation)                     si el idioma no está soportado
  | Err(NotShareable { reason })        reason: "score" (última puntuación < 8 o sin puntuar) ·
                                        "category" (sensible, excluida de la IA o no estándar) ·
                                        "reported" · "contact" · "health" · "offensive"
UnshareExperience({ userId, experienceId }) → Ok(Experience) | Err(NotFound)
ListSharedExperiences({ userId, categoryId, locale }) → Ok({ id, text }[])
  // vacío si la categoría del lector no es suya, no es estándar o está excluida
ReportSharedExperience({ userId, experienceId }) → Ok(true) | Err(NotFound)
  // NotFound si no está compartida, ya está reportada o es del propio usuario

PATCH /api/categories/diary  { id, shared: true, locale } → 200 ExperienceDto | 422 { error, reason } | 404
PATCH /api/categories/diary  { id, shared: false }        → 200 ExperienceDto | 404
GET   /api/categories/shared?categoryId=…&locale=…         → 200 { id, text }[]
POST  /api/categories/shared { id }                         → 200 { reported: true } | 404
```

## Criterios de aceptación

1. Given una categoría con 8 o más
   When pulsa "Compartir de forma anónima" en una experiencia y confirma la vista previa
   Then la experiencia lleva "Compartida"

2. Given una categoría con menos de 8, sensible o Pareja
   When mira sus experiencias
   Then no ve "Compartir de forma anónima"

3. Given una experiencia con un teléfono, con "medicación" o con un insulto
   When intenta compartirla
   Then no se publica y ve qué tiene que quitar

4. Given una experiencia compartida por otra persona en Economía, en su idioma
   When abre las ideas de Economía
   Then ve la pestaña "De otras personas (1)" con el texto, sin nombre ni fecha, y el aviso de que no es consejo profesional

5. Given la pestaña "De otras personas"
   When reporta una experiencia
   Then desaparece para todos y su autor la ve como "Retirada tras un reporte"

6. Given una experiencia compartida
   When pulsa "Dejar de compartir" (en el diario o en Privacidad y datos) o la borra
   Then nadie más la ve

7. Given las ideas con IA activadas
   When abre la ventana de ideas
   Then ve las pestañas "De la app" y "Con IA", y se abre en "Con IA"

8. Given experiencias compartidas
   When exporta sus datos o borra la cuenta (RF-05)
   Then la exportación dice cuáles están compartidas / se borran con la cuenta
