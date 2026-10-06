# Historia: La IA propone opciones a partir de una experiencia (RF-45)

**Nivel:** 3 — Spec Source ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)): objetivo claro y desafío complejo (texto libre del usuario hacia la IA, con salvaguardas). Si algo cambia, se cambia **aquí** y después el código.
**Referencias:** RF-45 (Could, Ciclo 2), RF-44 (diario), RF-41 (qué te ayuda), RF-42 (qué te lo pone difícil), RF-40 (ideas con IA), RF-30 (líneas de ayuda), RES-09 (sin detección de riesgo), RD-09 (catálogo curado), [ADR-05](../architecture-decisions/05_Fundamentos_IA.md), apartado 4.4; petición del autor del 5 oct.

Como usuario que escribe una experiencia
Quiero que la app me proponga, si yo quiero, qué opciones marcar a partir de lo que he escrito
Para que mis ideas tengan en cuenta lo que me pasa sin tener que traducirlo yo a la lista

## Principio

**La IA no escribe nada sobre la persona ni valora su estado: solo traduce su texto a la lista cerrada que ya existe** ("¿Qué te ayuda?" y "¿Qué te lo pone difícil?"). El usuario acepta o descarta cada propuesta, y solo lo que acepta cambia sus ideas (RF-41/RF-42), por el camino de siempre.

## Alcance

- **Voluntario y por partes:** un interruptor general en *Privacidad y datos* ("Sugerencias de la IA a partir de tus experiencias", desactivado por defecto, aparte del de RF-40) y, con él activado, un botón en cada experiencia: "Sugerir opciones con IA". Nada se envía sin ese toque.
- **Qué ve el usuario:** "La IA sugiere:" con chips de la lista cerrada ("Sitios con mucha gente" en Vida social…), cada uno con aceptar o descartar, y la etiqueta "Sugerido por IA". Aceptar marca la opción como si la tocara él: "✓ Ideas actualizadas" y el pulso en "Ideas para…" (RF-42). Si la IA no propone nada válido: "No hemos encontrado opciones en esta experiencia". Nunca se enseña texto escrito por la IA.
- **Siempre, junto al diario, el enlace a las líneas de ayuda (RF-30).**
- **Proveedor:** como RF-40, un *Fake* determinista primero (palabras clave → opciones, en local y E2E) y el modelo real cuando haya crédito (RF-40b). En producción, apagado hasta entonces.
- **Dónde vive:** el interruptor, en el perfil (`ai_suggestions_enabled` y su fecha, migración 0015; acción `/api/accounts/ai-suggestions`), disponible cuando lo está la IA de RF-40 (mismo proveedor). Las sugerencias, en `/api/recommendations/suggest-options` (router existente, sin función nueva). Las opciones aceptadas se guardan por las acciones de siempre (RF-41, RF-42). El interruptor entra en la exportación (RF-05).
- **Fuera de alcance:** que la IA escriba ideas a partir de la experiencia, categorías sensibles, guardar lo que devuelve el proveedor más allá de las claves aceptadas.

## Salvaguardas

1. **Consentimiento explícito y granular:** el interruptor general, más el toque en cada experiencia. Desactivar el interruptor quita el botón; no hay nada guardado que borrar más allá de las opciones que el usuario aceptó (que son suyas, como si las hubiera tocado).
2. **Salida cerrada y validada:** la IA solo puede devolver claves de las listas de esa categoría. La respuesta se valida contra un esquema; cualquier clave desconocida se descarta y, si no queda ninguna válida, no se propone nada. Nunca se enseña ni se guarda texto de la IA.
3. **Minimización:** antes de enviar se eliminan emails, enlaces, teléfonos y números largos (`redactPersonalData`); se envían solo el texto ya limpio, la clave de la categoría y las opciones posibles. Nunca categorías sensibles, ids, nombre, email de la cuenta ni puntuaciones. Se pide al proveedor no retener los datos. Los nombres propios **no** se pueden quitar de forma fiable (¿"Rosa" es una persona o un color?), así que no se promete: junto al botón se avisa "Antes de enviarla quitamos emails, teléfonos, enlaces y números largos. Si no quieres que se envíen, no escribas nombres de otras personas".
3.1. **Categorías excluidas de la IA:** además de las sensibles, las que el catálogo marca como `aiExcluded` (de momento, Pareja) nunca van a la IA: ni aquí ni en RF-40. Es distinto de "sensible": no pide consentimiento para activarla (no es dato de categoría especial del RGPD), solo la deja fuera de la IA.
3.2. **Aviso al enviar, no al escribir:** el diario no se valida (es privado; bloquear frases duras sería censurarlo y rozaría la detección de riesgo de RES-09). Al pulsar "Sugerir opciones con IA", si el texto lleva insultos o términos ofensivos (lista curada en `domain/catalog/offensiveTerms.json`), se avisa y el usuario decide: "Enviar igualmente" o "Cancelar".
4. **Sin detección de riesgo (RES-09):** a la IA no se le pide valorar nada, y su salida (claves cerradas) no puede expresarlo. No se analiza el texto en el servidor más allá de quitar datos personales. La respuesta ética al contenido difícil es la de siempre: el enlace permanente a las líneas de ayuda, para todos.
5. **Transparencia:** la política de privacidad explica qué se envía, a quién y para qué; cada propuesta lleva "Sugerido por IA".

## Contratos

```
SuggestOptionsRequest = {
  locale: "es" | "en",
  categoryKey: string,                         // clave estable; nunca el id ni el nombre del usuario
  text: string,                                // la experiencia, tras redactPersonalData, ≤ 500 caracteres
  helps: { key: string, label: string }[],     // opciones de "¿Qué te ayuda?" de la categoría (RF-41)
  difficulties: { key: string, label: string }[] // situaciones de la categoría (RF-42)
}

OptionSuggester.suggest(request) → { helps: string[], difficulties: string[] }   (puede lanzar o tardar)

redactPersonalData(text) → text   — sustituye emails, URLs, teléfonos (7 o más cifras, con espacios, puntos,
                                     guiones o prefijo +) y números de 6 o más cifras por "[…]"; nada más

SuggestExperienceOptions({ userId, experienceId, locale }) →
  Ok({ helps: string[], difficulties: string[] })   // solo claves válidas de esa categoría, sin las ya marcadas
  | Err(NotFound)    si la experiencia no existe o no es del usuario
  | Err(Validation)  si el idioma no está soportado
  — Ok vacío (sin error para el usuario) cuando: no hay proveedor · el usuario no lo ha activado ·
    la categoría es sensible o no estándar · el proveedor falla o tarda más de 8 s · no queda ninguna clave válida
```

## Criterios de aceptación

1. Given la función sin activar
   When mira sus experiencias
   Then no ve "Sugerir opciones con IA"

2. Given la función activada
   When pulsa "Sugerir opciones con IA" en una experiencia que habla de evitar sitios con mucha gente (Vida social)
   Then ve "Sitios con mucha gente" como sugerencia, con "Sugerido por IA", sin marcar todavía

3. Given una sugerencia
   When la acepta
   Then queda marcada como opción de la categoría, ve "✓ Ideas actualizadas" y las ideas cambian; si la descarta, desaparece

4. Given el proveedor devuelve una clave que no es de la categoría
   When se valida la respuesta
   Then esa clave se descarta

5. Given una experiencia con un email, un enlace y un teléfono
   When se pide la sugerencia
   Then al proveedor le llega el texto sin ellos (y el usuario ve antes el aviso sobre los nombres)

6. Given una categoría sensible o excluida de la IA (Pareja)
   When mira sus experiencias
   Then no ve "Sugerir opciones con IA" (y Pareja tampoco se personaliza en RF-40)

6.1. Given una experiencia con un insulto
   When pulsa "Sugerir opciones con IA"
   Then ve un aviso antes de enviar nada, y puede enviarla igualmente o cancelar

7. Given el proveedor falla o tarda
   When pide sugerencias
   Then ve "No hemos encontrado opciones en esta experiencia", sin error

## Historial de cambios

- **v1.0 (5 oct. 2026)** — versión inicial, pendiente de implementar tras RF-44. El dilema (texto libre hacia la IA, con estas salvaguardas, frente a RES-09) queda anotado para comentarlo con el tutor en la presentación.
- **v1.1 (5 oct. 2026)** — antes de implementarla: los nombres propios no se quitan (no se puede de forma fiable) y se avisa en su lugar; dónde viven el interruptor (perfil, migración 0015) y la acción (`suggest-options`, sin función nueva).
- **v1.2 (5 oct. 2026)** — implementada contra el *Fake* (palabras clave: propone una opción si el texto contiene todas sus palabras significativas, para no proponer "Conocer gente nueva" por la palabra "gente"). Los textos de RF-40 que decían que las experiencias nunca van a la IA pasan a decir "para estas ideas".
- **v1.3 (5 oct. 2026)** — tras probarla el autor: el diario dice dónde activarla si la función existe pero está desactivada, y el *Fake* compara por la raíz de las palabras ("viajé" encaja con "Viajar").
- **v1.4 (5 oct. 2026)** — decisiones del autor: Pareja (y lo que el catálogo marque como `aiExcluded`) queda fuera de la IA sin volverse sensible; aviso de términos ofensivos solo al enviar a la IA, con "Enviar igualmente".
- **v1.5 (6 oct. 2026)** — el enlace a las líneas de ayuda junto al diario ya está, con [RF-30](RF-30-lineas-ayuda.md).
