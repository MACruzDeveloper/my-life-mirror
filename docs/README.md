# Documentación de MyLifeMirror

> **Este no es el README principal del proyecto.** Es el índice de la carpeta `docs/`. Para saber qué es la app, cómo probarla y qué se entrega, empieza por el [README del proyecto](../README.md).

Mapa de todo lo que hay en `docs/`, una línea por documento, y por dónde empezar. El [README del proyecto](../README.md) explica cómo probar la app; [AGENTS.md](../AGENTS.md), las convenciones del código.

## Si tienes 20 minutos

1. [Requisitos](requirements-analysis/02_Requisitos_Fase1.md): qué hace la app y por qué (RN, RF, RNF, restricciones).
2. [Arquitectura (ADR-03)](architecture-decisions/03_Arquitectura_Software.md): monolito modular con Clean Architecture, y sus límites conocidos (apartado 6.1).
3. Una historia de usuario, p. ej. [RF-15, radar](user-stories/RF-15-radar-equilibrio.md): cómo se especifica cada funcionalidad antes de programarla.
4. [Resultados del test de usabilidad](validation/02_Resultados_Test_Usabilidad.md): qué dijo una usuaria real y qué cambió.
5. [Métricas DORA y Flow](project-management/02_Metricas_DORA_y_Flujo.md), apartado 7: cómo se ha trabajado, con datos, incluido lo que salió mal.

## Mapa

### Requisitos y análisis (`requirements-analysis/`)

| Documento | Qué contiene |
|---|---|
| [01 Justificación del ciclo de vida](requirements-analysis/01_Justificacion_Ciclo_Vida.md) | Por qué un espiral ligero y qué entra en cada ciclo (MVP, Ciclo 2, Ciclo 3). |
| [02 Requisitos](requirements-analysis/02_Requisitos_Fase1.md) | Requisitos de negocio, funcionales, no funcionales, restricciones y de datos, con prioridad MoSCoW. |
| [03 Matriz de trazabilidad](requirements-analysis/03_Matriz_Trazabilidad_Fase1.md) | Cada requisito de negocio con los funcionales que lo cubren. |
| [04 Plan de verificación y validación](requirements-analysis/04_Plan_Verificacion_Validacion.md) | Qué se prueba y cómo: tests, E2E con base de datos local, usabilidad, demos (y cómo ver los E2E funcionando, apartado 1.2.1). |
| [05-09 Diagramas](requirements-analysis/05_Diagrama_Clases.md) | Clases, secuencias (entrevista, consentimiento), casos de uso ([también en draw.io](requirements-analysis/07_Diagrama_Casos_Uso.drawio)) y estados de una recomendación. **Análisis inicial de septiembre**, no el diseño actual: cada uno lo avisa y da la equivalencia de nombres. |
| [10 Enfoque SDD](requirements-analysis/10_Enfoque_SDD.md) | Cómo se escriben las especificaciones (Nivel 2, Spec Anchored) y por qué no otro nivel. |

### Decisiones de arquitectura (`architecture-decisions/`)

| ADR | Decisión |
|---|---|
| [01 Stack](architecture-decisions/01_Stack_Tecnologico.md) | TypeScript, React y Node (Python solo para generar avatares, fuera de producción). |
| [02 Principios de diseño](architecture-decisions/02_Principios_Diseño.md) | SOLID, DRY, KISS, YAGNI y cuándo (no) aplicar un patrón. |
| [03 Arquitectura](architecture-decisions/03_Arquitectura_Software.md) | Monolito modular, Clean Architecture por módulo, funciones serverless y límites del plan gratuito. |
| [04 Almacenamiento](architecture-decisions/04_Almacenamiento_Datos.md) | Supabase (Postgres), migraciones SQL, y por qué nada "en memoria" entre funciones. |
| [05 Fundamentos de IA](architecture-decisions/05_Fundamentos_IA.md) | Dónde se usa IA y dónde no; RF-40 (ideas con IA ancladas al catálogo, con verificación). |
| [06 Autenticación](architecture-decisions/06_Autenticacion.md) | Supabase Auth, sesión en cookie, roles. |
| [07 Interfaz](architecture-decisions/07_UI.md) | Material UI, móvil primero, caché de datos del servidor. |
| [08 Observabilidad](architecture-decisions/08_Observabilidad.md) | Logs estructurados en JSON, sin servicios de pago. |
| [09 Internacionalización](architecture-decisions/09_Internacionalizacion.md) | Español e inglés; traducciones de categorías por id. |

### Historias de usuario (`user-stories/`)

Una por funcionalidad, con criterios Given/When/Then, antes de programarla: `RF-xx` (requisitos funcionales), `ADM-xx` (administración) y `UX-xx` (mejoras salidas de la validación). [Ver carpeta](user-stories/).

### Gestión del proyecto (`project-management/`)

| Documento | Qué contiene |
|---|---|
| [00 Metodología](project-management/00_Metodologia_Lean.md) | Lean + Kanban con plazo fijo (31 oct.) y por qué no sprints. |
| [01 Tablero](project-management/01_Backlog_MVP.md) | **Lo que está en curso, lo siguiente y lo pendiente.** Es el único sitio con "próximos pasos". |
| [02 Métricas DORA y Flow](project-management/02_Metricas_DORA_y_Flujo.md) | Plan y resultados: 11 PRs, fallos, tiempos, y los ajustes que salieron de ahí. |

### Validación con usuarios (`validation/`)

| Documento | Qué contiene |
|---|---|
| [01 Guion completo del test](validation/01_Guion_Test_Usabilidad.md) | Sesión larga (8 tareas + SUS), para próximas pruebas. |
| [02 Resultados](validation/02_Resultados_Test_Usabilidad.md) | La sesión del 27 sept.: tareas, respuestas, problemas y qué se hizo con ellos. |
| [03 Guion corto (EN)](validation/03_Short_Test_Script_EN.md) | El guion usado de verdad: 20 minutos, en inglés. |
| [04 Guion de la demo](validation/04_Guion_Demo_Cierre.md) | Demo final para la revisión del proyecto, y la lista de la primera entrega a producción. |

### Otros

- [Historial de prompts](Historial_Prompts.md): las peticiones que fijaron una decisión, con qué se decidió. El rastro del trabajo con IA.
- [CHANGELOG](../CHANGELOG.md): qué cambió en cada versión.

## Cómo crece esta documentación

Para que siga siendo legible en el Ciclo 2:

1. **Una historia de usuario por funcionalidad**, corta. Es el documento principal de cada cambio.
2. **Un ADR nuevo solo si hay una decisión nueva de arquitectura.** Si cambia una existente, se actualiza su ADR (con su historial de cambios).
3. **Lo pendiente solo en el tablero.** Ningún documento termina con "próximos pasos".
4. **Si un documento no merece una línea en este mapa, no se crea.** Y todo documento nuevo se añade aquí.

## Convenciones

- Cada documento termina con un **historial de cambios**: se edita en su sitio y se anota qué cambió, en vez de sobrescribirlo en silencio.
- Los apartados nuevos entre dos existentes son subapartados (2.1, 2.2…). Las referencias se escriben "ADR-03, apartado 6.1".
- Todos los documentos están en español (salvo el guion corto del test, en inglés a propósito); el código, en inglés.
