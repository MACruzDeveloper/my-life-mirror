# ADR-01: Selección de Stack Tecnológico (TypeScript + React + Node)

**Estado:** Aceptado
**Fecha:** 9 de septiembre de 2026
**Relacionado con:** [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md) §2 (punto 4), [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md), RES-01, RES-02, RES-03, RES-06, RNF-06 a RNF-10

---

## 1. Contexto

El repositorio ya arranca con un scaffold Vite + React 19 + TypeScript (`package.json`), y el Plan de V&V ya asumía este stack (Vitest, React Testing Library, Playwright) sin haberlo formalizado como decisión. Antes de escribir las historias de usuario del Ciclo 1, conviene dejarlo explícito y justificado — no solo "porque ya estaba así", sino comprobado contra las restricciones del proyecto y contra el panorama real de paradigmas de programación.

## 2. Decisión

Se confirma: **TypeScript** como lenguaje, **React** para el frontend, **Node** para cualquier lógica de backend (Cloud Functions sobre un BaaS tipo Firebase/Supabase, per RES-03 — probablemente no haga falta un servidor Node propio para el CRUD básico, que lo cubre el propio BaaS).

## 3. ¿Son lenguajes funcionales? (la pregunta de fondo)

Respuesta corta: **no, son multiparadigma** — y eso es distinto de "funcional".

- **Paradigmas que existen en el mercado**, a grandes rasgos: imperativo/procedural (C, Pascal), orientado a objetos (Java, C#), funcional (Haskell, Elm, F#, OCaml, Clojure), declarativo/lógico (Prolog, SQL), y combinaciones híbridas, que es donde vive la inmensa mayoría del software real hoy.
- **JavaScript** soporta los tres primeros a la vez: puedes escribir clases y herencia (POO), código imperativo con bucles y mutación de estado, o código funcional con funciones de primera clase, closures y métodos como `map`/`filter`/`reduce`. El lenguaje **no impone** ninguno — tú eliges, línea a línea.
- **TypeScript** es JavaScript con tipado estático encima. No cambia el paradigma: su sistema de tipos sirve igual de bien para modelar clases e interfaces (POO) que para tipos genéricos y uniones discriminadas (estilo funcional).
- **Node.js no es un lenguaje** — es un entorno de ejecución (runtime, sobre el motor V8 de Chrome) que permite correr JavaScript fuera del navegador. Hereda el mismo carácter multiparadigma.
- **¿Por qué parece funcional entonces?** Porque **React** (la librería, no el lenguaje) empuja un estilo declarativo/funcional: componentes de función, hooks, la UI tratada como una función pura del estado (`UI = f(estado)`), actualizaciones inmutables de estado. Eso es una convención de arquitectura que React fomenta y casi obliga en la práctica — no una propiedad de JavaScript/TypeScript en sí. Se podría escribir React con clases (como se hacía hace años) o escribir TypeScript totalmente imperativo si se quisiera; el lenguaje no lo impide.

**Comparación real con un lenguaje funcional puro** (Haskell, Elm, F#, Clojure): ahí la inmutabilidad y la ausencia de efectos secundarios las impone el propio compilador — no puedes mutar una variable aunque quieras. En TypeScript, la inmutabilidad es una **disciplina que hay que imponerse uno mismo** (evitar mutar objetos directamente, usar spread/`readonly`, etc.), no una garantía del lenguaje.

## 4. Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Lenguaje funcional puro** (Elm, PureScript, F#/Fable, ClojureScript) | Ventaja real: inmutabilidad forzada, menos errores de mutación. Pero ecosistema mucho más pequeño, curva de aprendizaje alta, y aplicar esa incertidumbre a **todo** el proyecto es un riesgo distinto (y mayor) que aplicarla a una función o feature concreta — que es lo que ya decidimos en el ciclo de vida (§5 más abajo). |
| **Stack POO clásico** (Java/Spring, C#/.NET) | Maduro y tipado con fuerza, pero mucho más pesado de desplegar/iterar en solitario (RES-02) y no es lo que ya conoces — no aporta velocidad para un TFM con fecha fija (RES-01). |
| **Python** (Django/Flask/FastAPI) | Ecosistema muy fuerte en IA/ML — relevante mencionarlo por ser un máster de IA. Pero el motor de recomendaciones definido (RF-18, RD-04) es lógica de umbral, no un modelo entrenado; si en el futuro se integra un LLM por API, Node/TypeScript tiene SDKs oficiales tan maduros como Python para eso. No hay una necesidad funcional real que empuje a Python, y separar el lenguaje entre frontend y backend añadiría cambio de contexto constante para una sola persona (RES-02). |

## 5. Cómo encaja con la incertidumbre técnica que sí queremos

En [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md) ya decidiste que querías incertidumbre técnica deliberada para aplicar lo aprendido en el máster. Usar un stack que ya dominas para el **núcleo** (cuentas, check-in, dashboard, CRUD) no contradice eso — al contrario: libera presupuesto de riesgo para invertirlo donde de verdad importa: el motor de recomendaciones, el cifrado de datos sensibles (RNF-04), o explorar algo nuevo dentro del propio ecosistema React/Node, en vez de arriesgar el proyecto entero peleándote con un lenguaje nuevo de punta a punta contra una fecha fija (RES-01).

## 6. Consecuencias

**Positivas:**
- Mismo lenguaje en frontend y backend → sin cambio de contexto para una sola persona (RES-02).
- TypeScript ayuda directamente a RNF-08 (mantenibilidad): las entidades RD-01 a RD-11 se pueden modelar como tipos explícitos, verificados en tiempo de compilación.
- El ecosistema de testing ya asumido en el Plan de V&V (Vitest, React Testing Library, Playwright) encaja de forma nativa.
- Compatible con RES-06 (web responsive/PWA) y con las opciones de capa gratuita de RES-03 (Vercel, Firebase Functions, Supabase — todas corren JS/TS o Node).
- Ecosistema maduro para accesibilidad (RNF-09, `eslint-plugin-jsx-a11y`) e internacionalización (RNF-10, `react-i18next`).

**A vigilar:**
- Al no ser un lenguaje funcional puro, la inmutabilidad no viene gratis — hay que imponerla por disciplina propia, especialmente en el motor de recomendaciones y en el manejo de `Consentimiento`/datos sensibles, donde un error de mutación sería grave (RES-04, RNF-04).

---

## 7. Extensión: Python para la generación offline de avatares (RF-26)

Esta decisión no contradice §4/§5 — es exactamente el tipo de uso acotado que ahí se recomendaba: Python **fuera** del runtime de producción, no mezclado en el camino de una petición en vivo.

- **Qué:** un script Python, ejecutado localmente por el desarrollador (no desplegado, no forma parte de la app), que llama a una API de generación de imágenes para producir el catálogo cerrado de avatares que pide RF-26.
- **Por qué encaja:** RF-26 ya especifica que los avatares se generan de antemano y se revisan editorialmente — nunca en vivo a partir de un prompt del usuario. Eso es, por definición, un paso de construcción de contenido, no una funcionalidad de la app. No añade una segunda pieza de infraestructura que mantener ni afecta a RES-01/RES-02/RES-03.
- **Salida:** un conjunto fijo de imágenes (assets estáticos) que el frontend React consume igual que cualquier otro recurso — el stack de la app en producción sigue siendo exclusivamente TypeScript/React/Node, sin cambios.
- **No establece precedente** para meter Python en el runtime — cualquier otro uso de Python que se plantee más adelante se evalúa aparte, con el mismo criterio de §4/§5.

---

## 8. Próximo paso

Con el stack confirmado, las historias de usuario del Ciclo 1 (Nivel 2 Spec Anchored, según [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)) ya pueden incluir referencias a tipos/contratos TypeScript concretos donde aplique. Dijiste que aún quedan más especificaciones de proyecto por definir antes de las historias — ¿cuál es la siguiente?

---

## Historial de cambios

- **v1.0 (9 sept. 2026)** — versión inicial: confirmación del stack, explicación de por qué JS/TS/Node son multiparadigma (no funcionales puros), alternativas consideradas, relación con la incertidumbre técnica deliberada del ciclo de vida.
- **v1.1 (9 sept. 2026)** — se añade §7: uso acotado de Python como herramienta offline para generar el catálogo de avatares de RF-26 (no forma parte del runtime de producción, no cambia el stack de la app).
