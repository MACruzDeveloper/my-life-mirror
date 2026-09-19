# ADR-03: Arquitectura de Software

**Estado:** Aceptado
**Fecha:** 9 de septiembre de 2026
**Relacionado con:** [01_Stack_Tecnologico.md](01_Stack_Tecnologico.md), [02_Principios_Diseño.md](02_Principios_Diseño.md), [04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md), [02_Requisitos_Fase1.md](../requirements-analysis/02_Requisitos_Fase1.md) (RNF-07, RNF-08), [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md), [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)

---

## 1. Contexto

RNF-08 exige, desde la Fase 1, "una arquitectura modular que permita añadir nuevas categorías sin modificar el core del sistema". RNF-07 (Could) pide poder crecer un orden de magnitud sin rediseño mayor. Al mismo tiempo, RES-01 (fecha fija) y RES-02 (una persona) advierten contra añadir complejidad operativa antes de necesitarla.

La arquitectura elegida es **Clean Architecture completa dentro de un Monolito Modular** — no porque el MVP lo exija por sí solo, sino como ejercicio deliberado de práctica de una arquitectura grande, resiliente al cambio y preparada para innovación constante, coherente con el motivo 4 de [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md) (incertidumbre técnica deliberada por aplicar lo aprendido en el máster). El coste de esa decisión frente a una opción más ligera se asume conscientemente — ver §5.

## 2. Alternativas consideradas

| Opción | Qué es | Veredicto |
|---|---|---|
| **MVC** | Patrón de capa de presentación, no de organización de sistema completo. | Descartada — responde a una pregunta distinta a la que se está resolviendo aquí. |
| **Microservicios / Event-Driven puro (con broker)** | Servicios independientes desplegados por separado, comunicados por red o por un bus de mensajes real. | Descartada para esta fase — coste operativo desproporcionado para RES-01/RES-02/RES-03. |
| **Monolito Modular + hexagonal ligero** | Un despliegue, módulos con fronteras claras, ideas de puertos/adaptadores sin ceremonia formal. | Descartada — el usuario prefiere practicar la disciplina completa de Clean Architecture, no la versión reducida. |
| **Monolito Modular + Clean Architecture completa** ✅ | Un despliegue, módulos = capacidades de negocio, y **dentro de cada módulo**, la disciplina completa de Clean Architecture: dominio inviolable, casos de uso, puertos/adaptadores, Composition Root. | Decisión final — ver §3. |

## 3. Decisión: Monolito Modular, con Clean Architecture dentro de cada módulo

Los módulos (macro-frontera) son las capacidades de negocio mapeadas a las secciones 2.1-2.11 de [02_Requisitos_Fase1.md](../requirements-analysis/02_Requisitos_Fase1.md) (Cuentas, Categorías, Evaluaciones, Recomendaciones, Notificaciones, Gamificación, Localización, Bienestar, Social, Funcionalidades asistidas por IA). Dentro de cada uno, se aplica Clean Architecture con todo su rigor.

### 3.1 La regla de oro: la dependencia siempre apunta hacia dentro

`Infraestructura → Aplicación → Dominio`. El dominio no importa nada de las capas externas — nunca conoce Express, MongoDB, ni ninguna librería de terceros. Si el dominio compila, las reglas de negocio básicas están garantizadas estructuralmente, no solo comprobadas por un test.

### 3.2 Capa de Dominio — el núcleo inviolable

- **Entidades**: identidad estable por ID único, nunca por sus atributos. Igualdad de entidades se valida exclusivamente por ese ID.
- **Value Objects**: inmutables, se validan a sí mismos en el momento de crearse, sin setters — cualquier operación devuelve una instancia nueva. Ejemplo directo de este proyecto: una `Puntuacion` como VO en vez de un `number` suelto, que valida el rango 1-10 (RF-10) en su propia construcción — imposible que exista en memoria una puntuación inválida.
- **Aggregate Root**: único punto de entrada para modificar un conjunto de objetos relacionados, garante de que las invariantes de negocio se cumplen antes de persistir cualquier cambio. Ejemplo: `Evaluación` como aggregate root que protege la regla de inmutabilidad de RF-12 (no editable retroactivamente salvo corrección en 24h).
- **Excepciones de dominio**: jerarquía tipada (error de negocio vs. error técnico), no `try/catch` genérico.
- **Eventos de dominio**: los emite únicamente el Aggregate Root ante cambios de estado significativos, y solo se publican **después** de que la persistencia esté confirmada (ver Outbox, §3.4) — nunca antes, para no anunciar algo que podría no haberse guardado.
- Sin I/O, sin imports de framework — testable en aislamiento total y a velocidad de milisegundos.

### 3.3 Capa de Aplicación — Casos de Uso

Cada historia de usuario del Ciclo 1 (formato Nivel 2 Spec Anchored, [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)) se traduce, de forma casi directa, en **un Caso de Uso** de esta capa.

- Los casos de uso orquestan **Puertos** (repositorios, servicios externos, bus de eventos) sin conocer su implementación concreta.
- Se comunican con el exterior exclusivamente mediante **DTOs** — nunca se deja escapar una Entidad o Value Object de dominio hacia un controlador o la UI.
- **Patrón Result** en vez de lanzar excepciones para resultados de negocio esperables (validación fallida, no encontrado, conflicto): el caso de uso devuelve un objeto que indica explícitamente éxito o fallo, obligando a quien lo llama a manejar todos los casos.
- Gestiona la transaccionalidad: todas las escrituras de un flujo se completan juntas o se revierten juntas.
- Nunca contiene lógica de serialización HTTP, consultas a la base de datos directas, ni lectura de variables de entorno — eso es responsabilidad de la infraestructura.

### 3.4 Capa de Infraestructura — Adaptadores y Composition Root

- Los **adaptadores** implementan los Puertos contra tecnología real: persistencia (p. ej. `MongoEvaluacionRepository` implementando `EvaluacionRepository` — ver [04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md)), mensajería, observabilidad, controladores HTTP.
- Los **controladores HTTP** solo reciben el input, validan tipos básicos, delegan al caso de uso, y traducen el Result/las excepciones de dominio a códigos de estado HTTP — cero lógica de negocio aquí.
- **Composition Root** (p. ej. un único `container.ts`): el único lugar del sistema con permiso para conocer implementaciones concretas y conectarlas a los casos de uso, según configuración de entorno. Ningún otro archivo debe instanciar un adaptador directamente.
- **Patrón Outbox** para publicar eventos de forma fiable: el adaptador persiste el evento en una tabla/colección de salida dentro de la misma transacción que el cambio de estado; un proceso aparte (dispatcher) se encarga de publicarlo después, evitando la fragilidad de publicar directamente a un bus de mensajes a mitad de transacción. Esto también da soporte natural al registro de auditoría de RNF-11 (ver [04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md) §4).
- Comportamiento por entorno: **desarrollo** (adaptador en memoria + logging verboso, para iterar rápido), **test** (base de datos efímera, reseteada entre ejecuciones), **producción** (MongoDB Atlas + outbox + telemetría).

### 3.5 Estructura de carpetas — empezar mínima, escalar cuando duela

Para el Ciclo 1, cada módulo usa la **estructura mínima** (`domain/`, `application/`, `infrastructure/`), sin la granularidad completa (infraestructura desglosada en persistencia/mensajería/observabilidad/controladores por separado) hasta que un Ciclo posterior la necesite de verdad. Se practica la disciplina completa desde el primer commit, sin pagar todavía su coste estructural máximo.

### 3.6 Testing — pirámide adaptada de Clean Architecture

Conecta directamente con [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md):

- **50-60%: tests unitarios de dominio** — funciones puras, Value Objects, Entidades, sin I/O. Rápidos, sin dependencias externas.
- **~30%: tests de aceptación de casos de uso** — con dobles de test, priorizando **Fakes** (implementaciones en memoria reales) sobre **Mocks** (expectativas programadas), para no acoplar el test a detalles de implementación.
- **Resto: tests de contrato + E2E**, reservados a las rutas realmente críticas (check-in → recomendación, consentimiento) — no se persigue el 100% de cobertura; la cobertura es un termómetro, no un objetivo. Los Playwright de Must-priority ya definidos en el Plan de V&V son, precisamente, esta capa E2E.

### 3.7 Disciplina — lo que nunca se debe hacer

- El dominio nunca importa nada de aplicación o infraestructura.
- Los DTOs viven en la capa de aplicación, son serializables, nunca transportan entidades de dominio.
- Sin ficheros "barrel" (`index.ts` de re-exportación) que crucen capas — evita importaciones circulares.
- Configuración y variables de entorno solo en infraestructura/Composition Root.
- Los adaptadores dependen de los puertos; el puerto nunca conoce al adaptador.
- Nomenclatura: PascalCase para Entidades/Value Objects; sufijo que revela la tecnología en los adaptadores (`MongoEvaluacionRepository`, `InMemoryEvaluacionRepository` para tests); casos de uso nombrados como verbos de acción (`RegistrarEvaluacion`, `ResponderRecomendacion`).

## 4. Cómo encaja con lo ya decidido

- Los patrones de [02_Principios_Diseño.md](02_Principios_Diseño.md) §4 se mapean 1:1: **Repository** es un Puerto; **Strategy** encaja como variantes de caso de uso o de lógica de dominio (p. ej. una estrategia de recomendación por categoría); **Adapter** son los adaptadores de infraestructura; **Factory** construye Entidades/Value Objects válidos.
- El formato Given/When/Then de las historias del Ciclo 1 encaja de forma natural con el patrón Result: Given/When son el "arrange/act", Then comprueba el Result devuelto por el caso de uso.
- Los módulos son la macro-frontera; Clean Architecture es la estructura interna de cada uno.

## 5. Coste asumido conscientemente

Esto es más aparato del que un MVP en solitario necesitaría por pura eficiencia. La decisión de pagar ese coste es explícita, informada y con un motivo de aprendizaje real, no un descuido. La mitigación de riesgo sobre RES-01 es la de §3.5: estructura mínima primero, granularidad completa solo cuando un Ciclo concreto la justifique — nunca por adelantado "por si acaso" (eso sería el anti-patrón de abstracción prematura de [02_Principios_Diseño.md](02_Principios_Diseño.md) §3).

## 6. Consecuencias

**Positivas:** dominio testable al 100% sin infraestructura real; cambiar de proveedor de base de datos no tocaría ninguna lógica de negocio; cada módulo queda estructuralmente preparado para extraerse a un servicio propio con fricción mínima; la curva de aprendizaje es deliberada y queda documentada como tal para la memoria del TFM.

**A vigilar:** más archivos y más ceremonia por funcionalidad que en una arquitectura más ligera. El riesgo real es la tentación de saltarse capas bajo presión de fecha (RES-01) — la disciplina "cero imports de infraestructura en dominio/aplicación" es la primera que se rompe con prisa, y la más cara de deshacer después.

---

## 7. Próximo paso

Con arquitectura y almacenamiento de datos ya decididos ([04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md)), el siguiente paso son las historias de usuario del Ciclo 1, módulo por módulo, cada una como un Caso de Uso — empezando por el adaptador en memoria antes que la conexión real a MongoDB Atlas.

---

## Historial de cambios

- **v1.0 (9 sept. 2026)** — versión inicial: Monolito Modular + hexagonal ligero por módulo.
- **v2.0 (9 sept. 2026)** — se sustituye por Clean Architecture completa dentro de cada módulo, por decisión del usuario (practicar una arquitectura grande). Se mantiene el Monolito Modular como macro-frontera.
- **v2.1 (12 sept. 2026)** — limpieza editorial: se retira la narrativa de revisión del cuerpo principal (queda solo aquí), se corrigen referencias desactualizadas a Firebase/Supabase por MongoDB Atlas (ya decidido en ADR-04), se actualiza §7.
- **v2.2 (19 sept. 2026)** — `api/tsconfig.json` es necesario y debe ser **autocontenido, sin `extends`** (Vercel no lo resuelve; mantenerlo alineado a mano con `tsconfig.api.json`): Vercel compila cada función con el `tsconfig.json` más cercano hacia arriba; sin él usa el de la raíz (solo referencias, sin opciones) y cae en `nodenext`, que rompe los imports sin extensión. No lo cubre `tsc -b` local porque este usa `tsconfig.api.json` directamente. Para vigilarlo: `npm run check:api`, que imita esa compilación.
