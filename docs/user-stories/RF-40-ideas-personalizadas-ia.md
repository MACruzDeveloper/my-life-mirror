# Historia: Ideas personalizadas con IA (RF-40a, contra un *Fake*)

**Nivel:** 3 — Spec Source ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md), apartado 6): objetivo muy claro y desafío complejo (contratos, reglas de seguridad, privacidad). Si algo cambia, se cambia **aquí** y después el código.
**Referencias:** RF-40 (Should, Ciclo 2), RF-41 (opciones "qué me ayuda"), RF-18 (recomendaciones), RD-09 (catálogo curado), RES-05 (aviso), RES-09 (sin detección de riesgo), RN-04 (tono), [ADR-05](../architecture-decisions/05_Fundamentos_IA.md), apartado 4.3; plan del Ciclo 2 (29 sept.)

Como usuario que recibe una idea para un área baja
Quiero que la idea tenga en cuenta lo que me ayuda y cómo voy
Para que me resulte más útil que una sugerencia genérica

## Alcance

- **Voluntario:** el usuario lo activa en *Privacidad y datos* ("Ideas personalizadas con IA", desactivado por defecto), con la explicación de qué se envía y qué no. Desactivarlo borra las ideas ya personalizadas.
- **Cuándo:** la primera vez que ve una idea de una recomendación abierta. La ventana de ideas es un carrusel con las 5 del catálogo de la categoría (primero la recomendada, UX-05); cada una se personaliza al verla. Se guarda y las siguientes veces se lee lo guardado, **salvo que hayan cambiado sus opciones de "¿Qué te ayuda?"**: entonces se reescribe con las nuevas (v1.1).
- **Qué hace la IA:** reescribe la idea del catálogo que el usuario está viendo en 2-3 frases cálidas que tengan en cuenta lo que le ayuda (RF-41) y si el área sube o baja. No inventa ideas nuevas.
- **Caída segura:** si algo falla (sin activar, no disponible, categoría sensible, error, tiempo agotado, filtro, revisión), se ve el texto curado del catálogo, como hasta ahora.
- **Transparencia:** la idea personalizada lleva la etiqueta "Personalizada con IA" y la original está en la pestaña "De la app" (antes, un enlace "Ver la idea original"; RF-43); el aviso de RES-05 se ve siempre.
- **En esta historia, el escritor es un *Fake*** determinista (`AI_IDEAS_PROVIDER=fake`, en desarrollo local y E2E). En producción la función está apagada (sin proveedor) hasta RF-40b (Anthropic).
- **Catálogo:** pasa de 2 a 5 ideas por categoría (es/en), para que haya entre qué elegir. Redactadas con ayuda de IA y **revisadas por el autor** antes de fusionar: sigue siendo contenido curado (RD-09).
- **Fuera de alcance:** el adaptador real (RF-40b), texto libre del usuario (nunca), categorías sensibles (v1), situaciones a evitar (idea RF-42), editar el catálogo desde el admin (idea ADM-04).

## Contratos

```
IdeaRequest = {
  locale: "es" | "en",
  categoryKey: string,                       // clave estable ('deporte'); nunca el id ni el nombre del usuario
  score: number,                             // última puntuación de la categoría (1-10)
  trend: "first" | "up" | "down" | "steady", // última frente a la anterior
  helpfulThings: string[],                   // textos de las opciones RF-41 marcadas, en `locale`
  candidates: { templateKey: string, text: string }[]  // la idea del catálogo que se está viendo (una), en `locale`
}
  — Nunca contiene: nombre, email, ids, notas o experiencia privada, categorías sensibles.

IdeaWriter.write(request) → { templateKey, text }         (puede lanzar o tardar)
IdeaWriter.model: string                                   (se guarda con cada idea: "fake", luego el modelo real)
IdeaReviewer.review(draft, request) → { approved: boolean, reasons: string[] }

checkIdeaSafety(draft, request) → { safe: true } | { safe: false, reason }
  — No es seguro si:
    · draft.templateKey no está en request.candidates
    · la longitud del texto no está entre 40 y 400 caracteres
    · contiene un término bloqueado (es/en): diagnósticos y lenguaje clínico, medicación o dosis,
      productos financieros o promesas de rentabilidad, obligación ("tienes que", "deberías", "you must"…),
      juicios ("fracaso", "vago", "lazy"…), enlaces, emails o teléfonos.

PersonalizeRecommendation({ userId, recommendationId, templateKey?, locale }) →
  Ok({ source: "ai", templateKey, text } | { source: "catalog", templateKey })
  | Err(NotFound)    si la recomendación no existe o no es del usuario
  | Err(Validation)  si el idioma no está soportado o templateKey no es una idea del catálogo de esa categoría
  — templateKey: la idea del carrusel que se está viendo; por defecto, la de la propia recomendación.
  — "catalog" (esa misma plantilla; la interfaz pinta su texto curado con sus traducciones) cuando:
      no hay proveedor configurado · el usuario no lo ha activado · la recomendación no está abierta ·
      la categoría es sensible, no existe o no es estándar (sin clave: las del admin usan plantillas generales) · el escritor o el revisor fallan o tardan más de 8 s ·
      checkIdeaSafety no es seguro · el revisor no aprueba
  — "ai": si ya hay una idea guardada para (recomendación, plantilla, idioma) escrita con las mismas opciones
    de "¿Qué te ayuda?" que la categoría tiene ahora, esa; si no, la nueva, que se guarda (sustituye a la anterior).
  — Un fallo nunca es un error para el usuario: siempre hay texto.

SetAiIdeas({ userId, enabled }) → Ok(Profile) | Err(NotFound sin perfil)
  — Guarda aiIdeasEnabled y la fecha (al activar). Al desactivar, borra las ideas personalizadas del usuario.
  — Actualizar el resto del perfil (UpdateProfile) conserva la elección.
```

## Criterios de aceptación

1. Given la función disponible y el usuario sin activarla
   When abre una idea
   Then ve el texto curado, sin etiqueta de IA

2. Given el usuario la activa en Privacidad y datos
   When abre la idea de un área no sensible y baja
   Then ve una idea con "Personalizada con IA" y puede ver la original

3. Given una idea ya personalizada
   When la vuelve a abrir sin haber cambiado "¿Qué te ayuda?"
   Then se lee la guardada, sin llamar otra vez al escritor

3.1. Given una idea ya personalizada
   When cambia sus opciones de "¿Qué te ayuda?" y la vuelve a ver
   Then se reescribe con las opciones nuevas

4. Given una categoría sensible
   When abre su idea
   Then ve el texto curado aunque lo tenga activado

5. Given el escritor falla, tarda demasiado o devuelve algo que no pasa el filtro o la revisión
   When abre la idea
   Then ve el texto curado, sin error

6. Given el usuario lo desactiva
   When vuelve a abrir una idea
   Then ve el texto curado y las ideas personalizadas guardadas se han borrado

7. Given la función no disponible (producción sin proveedor)
   When entra en Privacidad y datos
   Then no ve la opción

8. Given ideas personalizadas guardadas
   When exporta o borra sus datos (RF-05)
   Then salen en la exportación / se borran

## Notas de diseño

- Dominio (`recommendations/domain/`): `IdeaWriter`/`IdeaReviewer` (puertos), `checkIdeaSafety` (regla pura, con su conjunto de casos de evaluación reutilizable con el modelo real), `PersonalizedIdea` y su repositorio, y `IdeaTexts` (puerto para leer los textos del catálogo y de las opciones en el servidor).
- Los textos del catálogo siguen en `es.json`/`en.json`; en el servidor los lee `JsonIdeaTexts` importando esos archivos (`check:api` comprueba que carga).
- Datos (migración 0011): tabla `personalized_ideas` (por recomendación e idioma, se borra con la recomendación y con el usuario) y `profiles.ai_ideas_enabled` / `ai_ideas_enabled_at`. Migración 0012 (v1.1): la clave pasa a (recomendación, plantilla, idioma) y cada idea guarda las opciones con las que se escribió (`experience_tags`).
- Coste con el proveedor real (RF-40b): como mucho una llamada por idea vista (5 por recomendación) y otra cada vez que cambien las opciones; siempre al verla, nunca por adelantado.
- API: `api/recommendations/[action].ts` con `personalize` (11/12 funciones) y la acción `ai-ideas` en el router de cuentas. La sesión dice si la función está disponible (`aiIdeasAvailable`).

## RF-40b: el modelo real (11 oct. 2026)

Sustituye al *Fake* en producción, para RF-40 (ideas) y RF-45 (sugerencias desde el diario). No cambia nada de lo anterior: mismos puertos, mismo filtro, misma caída al texto curado.

- **Proveedor y modelo:** API de Anthropic, Claude Haiku 5.5 (`claude-haiku-5-5`), con esfuerzo bajo. Se activa con `AI_IDEAS_PROVIDER=anthropic` y `ANTHROPIC_API_KEY` (solo en el servidor). Sin clave, la función queda apagada, con un aviso en el log. En local y en los tests se sigue usando el *Fake*: desarrollar no gasta crédito.
- **Salida estructurada:** cada llamada pide una respuesta con esquema (Zod). Si no encaja, si el modelo rehúsa o si falla o tarda, es un error del proveedor y se cae al texto curado (ideas) o a "sin sugerencias" (RF-45), como hasta ahora.
- **Tres llamadas posibles:**
  - *Escritor* (RF-40): reescribe **la** idea candidata, en el idioma pedido, en 1-3 frases (40-400 caracteres), con tono cálido y de propuesta. Puede apoyarse en lo que al usuario le ayuda y en la tendencia; no cita la puntuación.
  - *Revisor* (RF-40): segunda pasada sobre el borrador; aprueba o rechaza con motivos (lenguaje diagnóstico, consejo profesional o financiero, obligación, juicio, se aparta de la idea original).
  - *Sugeridor* (RF-45): devuelve solo claves de las opciones recibidas.
- **Reglas del prompt** (las mismas que comprueba el filtro, más las que solo un modelo puede juzgar): nada de diagnósticos ni términos clínicos, medicación, terapia ni productos financieros; nada de "tienes que" o "deberías"; sin juicio ni alarde; sin enlaces ni teléfonos; sin inventar datos del usuario; sin valorar su estado (RES-09).
- **Qué se envía:** lo de siempre (ver Contratos). El prompt no añade ningún dato del usuario.
- **Tope de uso:** cada usuario puede provocar como mucho `AI_DAILY_LIMIT` usos de IA al día (por defecto 40; un uso = una idea personalizada o una sugerencia). Superado, se responde como si el proveedor no estuviera: texto curado o "sin sugerencias". Se cuenta en la base de datos (tabla `ai_usage`, migración 0020), porque las funciones no comparten memoria. Con el *Fake* no se cuenta.
- **Coste:** crédito de prepago sin recarga automática (el tope real), límite mensual en la consola y el tope por usuario. Estimación: unas 0,05 céntimos de dólar por idea.
- **Evaluación con el modelo real** (`npm run eval:ai`, solo a mano: gasta crédito): un conjunto de peticiones reales (categorías, idiomas, tendencias, con y sin "qué te ayuda") por el escritor y el revisor, y los borradores malos del conjunto del filtro por el revisor. Se mide cuántas ideas llegan al usuario (pasan filtro y revisión) y cuántos borradores malos se paran. Los resultados se anotan en ADR-05.

### Criterios de aceptación (RF-40b)

9. Given `AI_IDEAS_PROVIDER=anthropic` sin `ANTHROPIC_API_KEY`
    When arranca el servidor
    Then la IA queda apagada (la opción no se ofrece) y se avisa en el log

10. Given el modelo devuelve algo que no encaja con el esquema, o rehúsa
    When se pide una idea personalizada
    Then se ve el texto curado, sin error

11. Given un usuario que ya ha agotado su tope diario
    When pide otra idea personalizada o una sugerencia
    Then recibe el texto curado o "sin sugerencias", y no se llama al proveedor

12. Given el proveedor *Fake*
    When se usa la IA en local o en los tests
    Then no se cuenta el uso ni se llama a ningún servicio externo

## Historial de cambios

- **v1.0 (2 oct. 2026)** — versión inicial (PR 3 del plan del Ciclo 2).
- **v1.1 (3 oct. 2026)** — con el carrusel de UX-05, la IA reescribe la idea que el usuario está viendo (ya no elige entre las 5): `templateKey` en la petición, ideas guardadas por (recomendación, plantilla, idioma) y reescritas si cambian las opciones de "¿Qué te ayuda?". Petición del autor: "si luego selecciono algo en qué te ayuda debería ofrecerme otras ideas basadas en la respuesta".
- **v1.2 (5 oct. 2026)** — con RF-43, la ventana de ideas pasa a pestañas: la personalizada en "Con IA" (la que se abre primero) y la original en "De la app", en lugar del enlace "Ver la idea original".
- **v1.3 (11 oct. 2026)** — RF-40b: el modelo real (Claude Haiku 5.5), salida estructurada, tope diario por usuario y evaluación con el modelo.
- **v1.4 (11 oct. 2026)** — con el tope diario agotado, la ventana enseña la idea original y dice por qué; ante un fallo del proveedor sigue enseñando solo la idea original, como antes.
