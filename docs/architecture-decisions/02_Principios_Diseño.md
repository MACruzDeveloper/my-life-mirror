# ADR-02: Principios de Diseño y Buenas Prácticas de Código

**Estado:** documento vivo — edítalo libremente a medida que el proyecto evolucione. Es el contrato de calidad de código contra el que se comprueba cada cambio (escrito por una persona o por una IA), del mismo modo que los criterios Given/When/Then de [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md) son el contrato de comportamiento.
**Fecha:** 9 de septiembre de 2026
**Relacionado con:** [01_Stack_Tecnologico.md](01_Stack_Tecnologico.md) — TypeScript/React/Node, multiparadigma, con inclinación funcional por convención (no impuesta por el lenguaje). Los checklists de abajo están redactados para esa realidad, no para POO basada en clases.

---

## 1. SOLID — adaptado a funciones, hooks y módulos

En un código con pocas clases, "clase" se lee abajo como "función, hook, componente o módulo" — SOLID trata de límites de responsabilidad, no de la sintaxis `class` en concreto.

### SRP — Responsabilidad Única
- ¿Este módulo/componente/función cambiaría por más de un motivo de negocio distinto? Si es así, se debería dividir.
- ¿El nombre describe una sola acción/responsabilidad clara, sin un "y" de por medio?
- ¿La lógica de renderizado está separada de la lógica de negocio/datos (p. ej. un hook propio, en vez de todo mezclado en el componente)?

### OCP — Abierto/Cerrado
- ¿Puedo añadir un caso nuevo (una categoría nueva, un tipo de recomendación nuevo) añadiendo código, sin tocar el código existente?
- ¿Hay un `switch`/`if-else` que crecerá cada vez que se añada un caso nuevo? Es señal de que aquí falta una abstracción (p. ej. un mapa de estrategias).
- ¿La extensión se hace por composición (una función/estrategia nueva) en vez de editando una función central?

### LSP — Sustitución de Liskov
- Si dos implementaciones cumplen el mismo `type`/`interface`, ¿el código que las usa funciona igual sin necesitar saber cuál de las dos recibió?
- ¿Alguna implementación lanza errores o exige datos extra que las demás no exigen, rompiendo el contrato común?
- Aplicado aquí en concreto: ¿todas las estrategias de recomendación por categoría respetan exactamente la misma firma de entrada/salida?

### ISP — Segregación de Interfaces
- ¿Este `type`/`interface` obliga a implementar campos/métodos que no todos los casos necesitan?
- ¿Se podría partir una interfaz grande en varias más pequeñas y específicas?
- ¿Un componente recibe props que nunca usa, solo porque un padre genérico se las pasa?

### DIP — Inversión de Dependencias
- ¿La lógica de negocio importa Firebase/Supabase directamente, o depende de una abstracción que se le inyecta?
- ¿Se puede testear esta función/hook sin una base de datos real, usando un mock que cumpla la misma interfaz?
- Si mañana cambiara el proveedor de backend, ¿cuántos archivos de lógica de negocio habría que tocar? (Debería ser casi ninguno — ver el patrón Repository en §4.)

## 2. DRY / KISS / YAGNI

- **DRY** — ¿Esta lógica ya existe en otro sitio, copiada y pegada? ¿Duplicar aquí es una decisión consciente (desacoplar dos cosas que solo se parecen por casualidad) o simplemente pereza?
- **KISS** — ¿Hay una forma más simple con las herramientas nativas del lenguaje? ¿Se podría explicar esta solución en una frase, o hace falta un diagrama?
- **YAGNI** — ¿Esto resuelve un requisito que existe **hoy**, con un ID de RF/RN detrás — o una necesidad hipotética futura? Añadir configurabilidad/parámetros extra para un caso que no está en los documentos de requisitos es señal de alerta.

## 3. Anti-patrones

Lo que convierte algo en anti-patrón, y no solo en un bug: parece buena idea al principio, se usa con frecuencia, causa problemas a largo plazo, y es difícil de deshacer una vez implementado. Vigilar especialmente estos en este proyecto:

| Anti-patrón | Por qué resulta tentador | Por qué duele | Hacer esto en su lugar |
|---|---|---|---|
| **God Component** | Es rápido escribir un componente que consulta datos, calcula y renderiza todo a la vez | Cualquier cambio arriesga romper algo no relacionado | Extraer la lógica de datos a un hook, dejar el componente solo con el renderizado |
| **Prop drilling** | Es la forma más directa de bajar datos 4-5 niveles | Cada componente intermedio se acopla a props que no usa | Composición, o colocar el estado más cerca de donde se usa |
| **Abuso de Context/store** | "Lo meto en estado global por si acaso" | Re-renders innecesarios, acoplamiento oculto | Mantener el estado local salvo que de verdad sea compartido por toda la app |
| **Espagueti de `useEffect`** | Encadenar efectos que se disparan entre sí para sincronizar estado | Difícil de seguir, fácil crear bucles | Derivar el estado directamente en el render, o usar un reducer |
| **Abstracción prematura** | Construir una interfaz "por si hace falta en el futuro" sin un segundo caso real todavía | La abstracción equivocada cuesta más deshacerla que no tener ninguna | Esto es YAGNI aplicado a arquitectura — esperar al segundo caso |
| **Strings/números mágicos** | Escribir un literal es rápido | Los estados de `Recomendación` (`pendiente_respuesta/hecha/descartada/pospuesta`, RD-04) se desincronizan si se escriben como strings sueltos | Un único tipo unión/enum con nombre, importado en todas partes |
| **Singleton manual** | Parece POO "correcta" | El estado de nivel superior de un módulo ES ya es un singleton | Usar directamente estado a nivel de módulo, sin la clase |

## 4. Patrones de diseño — solo donde compensan su coste

Patrones que merece la pena usar **porque los requisitos reales del proyecto lo piden**:

- **Strategy** → el motor de recomendaciones (RF-18, RF-20): una estrategia por categoría/condición. Añadir una nueva no debería tocar las existentes (esto **es** OCP). En TS suele bastar un mapa `Record<string, (evaluacion) => Recomendacion>` de funciones planas — no hace falta una jerarquía de clases.
- **Repository** → la capa de acceso a datos (ligado directamente a DIP). Definir una interfaz tipo `EvaluacionRepository` (`guardar`, `obtenerHistorico`); la lógica de negocio nunca importa MongoDB directamente ([ADR-04](04_Almacenamiento_Datos.md)), solo la interfaz.
- **Adapter** → normalizar proveedores externos detrás de una única forma interna: proveedores de identidad (RF-02, Google/Apple), o canales de notificación (RF-22, push vs. email).
- **Factory** → creación consistente de `Recomendación` con el estado inicial correcto (RD-04). Suele bastar una función factory simple (`crearRecomendacion(...)`), no una clase.
- **Observer** → casi nunca hace falta implementarlo a mano aquí. El estado/props de React ya da esto de serie; para algo fuera del ciclo de render de React, comprobar primero `EventTarget`/`CustomEvent` nativos antes de escribir un sistema de pub-sub desde cero.

**Antes de implementar un patrón, comprobar si el lenguaje ya lo resuelve:**

| Patrón que se está pensando implementar | Alternativa nativa de JS/TS a probar primero |
|---|---|
| Observer | `EventTarget`/`CustomEvent`, o simplemente estado de React |
| Strategy | Función de orden superior / mapa `Record<string, Fn>` |
| Factory | Una función factory simple |
| Singleton | Un módulo ES (el estado de nivel superior ya es único por módulo) |
| Iterator | `for...of`, generadores nativos |
| Command / encolado async | `Promise`, `async`/`await` |

**Ejemplo real de esta disciplina, no solo teoría:** al configurar Vitest (configuración inicial, ver el [tablero del MVP](../project-management/01_Backlog_MVP.md)), se instaló primero el plugin `vite-tsconfig-paths` para resolver los alias de módulo. Vitest avisó en su propia salida de que Vite ya trae esa resolución de forma nativa (`resolve.tsconfigPaths: true`). Se quitó el plugin y se usó la opción nativa — una dependencia menos que mantener, mismo resultado.

## 5. Cómo encaja esto con el flujo de SDD

Según [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md), cada historia de usuario del Ciclo 1 se especifica como Nivel 2 (Spec Anchored) con criterios de aceptación Given/When/Then. Esos criterios comprueban el *comportamiento*. Este archivo es la segunda comprobación, complementaria: *cómo* está estructurado el código que satisface ese comportamiento. Una historia puede cumplir todos sus criterios de aceptación y aun así violar SRP o introducir un God Component; las dos comprobaciones importan, y con la revisión por pares en pausa (ver [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md)), este archivo hace de sustituto de esa segunda mirada hasta que haya alguien disponible.

---

## Mantenimiento


Este archivo rige el código escrito a partir de las historias de usuario del Ciclo 1. Edítalo directamente cuando una regla resulte estar mal planteada o falte algo para este proyecto — no hace falta pedir permiso para añadidos pequeños, basta con anotarlos abajo.
