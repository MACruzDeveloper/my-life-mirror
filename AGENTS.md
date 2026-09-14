# 🤖 Instrucciones para el Asistente de IA — MyLifeMirror

Este documento da contexto general del proyecto a cualquier asistente de IA (o persona) que trabaje en este repositorio. Es un punto de entrada, no una duplicación — cada sección enlaza al documento que tiene el detalle completo.

---

## 📌 Propósito y Rol

* **Objetivo principal**: asistir en el desarrollo de **MyLifeMirror**, una app de autoevaluación y mejora de vida por categorías — TFM del Máster en Desarrollo con IA (BIG School).
* **Rol**: actuar como desarrollador experto en TypeScript/React/Node aplicando Clean Architecture dentro de un Monolito Modular, y como copiloto de la documentación técnica del propio TFM.

## 🛠️ Restricciones y Alcance

* **Tecnologías**: TypeScript + React + Node ([ADR-01](docs/architecture-decisions/01_Stack_Tecnologico.md)). Python solo para el script offline de generación de avatares (ADR-01 §7) — nunca en el runtime de producción.
* **Base de datos y autenticación**: Supabase (Postgres + Auth gestionada) — sustituyó a MongoDB Atlas ([ADR-04](docs/architecture-decisions/04_Almacenamiento_Datos.md) v2.0). Autenticación vía `AuthProvider`/Supabase Auth, nunca hash o JWT propios ([ADR-06](docs/architecture-decisions/06_Autenticacion.md)). Zod sigue siendo la fuente de verdad de los DTOs en la capa de aplicación.
* **Arquitectura**: Monolito Modular — módulos = capacidades de negocio (Cuentas, Categorías, Evaluaciones, Recomendaciones...) —, con Clean Architecture completa dentro de cada uno (dominio/aplicación/infraestructura). Empezar cada módulo con la estructura mínima, no la granularidad completa desde el primer commit ([ADR-03](docs/architecture-decisions/03_Arquitectura_Software.md) §3.5). Cada módulo añade también una carpeta `ui/` para sus componentes React — es la capa de entrega, fuera de las tres capas de Clean Architecture; nunca importa `infrastructure/` directamente (ver Prohibiciones).
* **Principios de código**: SOLID, DRY, KISS, YAGNI, y comprobar la alternativa nativa antes de aplicar un patrón de diseño ([ADR-02: Principios de Diseño](docs/architecture-decisions/02_Principios_Diseño.md)).
* **Metodología de especificación**: cada historia de usuario se escribe primero en formato Nivel 2 (Spec Anchored) — Given/When/Then, referenciada a su RF/RD — antes de escribir código. Nivel 3 solo si el objetivo es muy claro y el desafío es de tamaño medio/complejo ([10_Enfoque_SDD.md](docs/requirements-analysis/10_Enfoque_SDD.md)).
* **Idioma**: la conversación con el usuario es en inglés; todos los documentos `.md` entregables se escriben en español.
* **i18n de la interfaz** (RNF-10): ningún texto visible para el usuario se escribe a mano dentro de un componente — siempre `t("namespace.clave")` de `react-i18next`, con la clave añadida a la vez en `src/shared/ui/i18n/locales/es.json` y `en.json` ([ADR-09](docs/architecture-decisions/09_Internacionalizacion.md)). El idioma por defecto es español; el cambio es manual (selector en el `Header`), sin detección automática del navegador.

## 🚀 Comandos

* `npm run dev` — servidor de desarrollo (Vite; solo frontend, no ejecuta `api/`).
* `npx vercel dev` — frontend + funciones de `api/` juntos (necesita `npx vercel link` una vez, con tu cuenta de Vercel). No se instala `vercel` como dependencia del proyecto — su árbol de dependencias trae paquetes de soporte para decenas de frameworks con vulnerabilidades conocidas; se usa vía `npx` (o instalado globalmente en tu máquina), igual que la mayoría de CLIs de este tipo.
* `npm run dev:full` — igual que arriba, pero abre el navegador automáticamente (macOS, comando `open` nativo — `vercel dev` no tiene un flag `--open` propio).
* `npm run build` — build de producción (`tsc -b && vite build`).
* `npm run lint` — ESLint.
* `npm run preview` — sirve el build de producción localmente.
* `npm run test` / `npm run test:watch` — Vitest. Todos los tests viven en `tests/`, con la misma estructura de carpetas que `src/` (nunca colocados junto al archivo que prueban) — p. ej. `src/shared/domain/Result.ts` se prueba en `tests/shared/domain/Result.test.ts`. React Testing Library y Playwright, según el Plan de V&V ([04_Plan_Verificacion_Validacion.md](docs/requirements-analysis/04_Plan_Verificacion_Validacion.md)), se añaden cuando haga falta probar componentes/flujos completos.

## 🔴🟢 TDD (desde el Sprint 1)

Cada pieza nueva (Entidad, Value Object, caso de uso, adaptador) se construye en este orden, sin excepción:

1. Escribir el test en `tests/` primero — con Fakes si hace falta un doble de una dependencia (preferidos sobre Mocks, ADR-03 §3.6).
2. Ejecutarlo y comprobar que falla (el código todavía no existe o no cumple el test).
3. Escribir el código mínimo para que pase.
4. Refactorizar si hace falta, sin romper el test.

No se escribe implementación antes que su test correspondiente.

## ✅ Tareas Clave

* Redactar las historias de usuario del Ciclo 1 en formato Nivel 2 (Spec Anchored).
* Implementar cada historia como un Caso de Uso de la capa de Aplicación, con su Entidad/Value Object en Dominio y su adaptador en Infraestructura.
* Empezar cada módulo con un adaptador de repositorio en memoria antes que la conexión real a Supabase, salvo el propio proveedor de autenticación, que usa Supabase real también en `dev` (sin sustituto en memoria razonable, ADR-06 §1).
* Generar boilerplate repetitivo (esquemas Zod, mapeadores Entidad↔documento, dobles de test/Fakes para los puertos) cuando se pida — siempre a revisar por el usuario antes de darse por bueno.
* Mantener actualizados los documentos de `docs/requirements-analysis/` y `docs/architecture-decisions/` cuando una decisión cambie.

## 📖 Documentación y Control de Versiones

* Cada documento de `docs/` conserva su contenido y añade una sección **"Historial de cambios"** al final en vez de sobrescribirse en silencio.
* [docs/Historial_Prompts.md](docs/Historial_Prompts.md) registra cada prompt que fija una decisión de diseño, proceso o alcance — no cada mensaje.
* `package.json` sube de versión siguiendo [SemVer](https://semver.org/lang/es/) en cada cambio significativo, y [CHANGELOG.md](CHANGELOG.md) registra los cambios siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) — el mismo espíritu que ya se aplica a los documentos, extendido al código. Mientras el proyecto esté en `0.x` (antes del cierre del Ciclo 1), MINOR = nueva funcionalidad, PATCH = corrección; sin API pública que rompa compatibilidad todavía.
* Commits/push solo cuando el usuario lo pida explícitamente.

## 🚫 Prohibiciones

* No implementar detección algorítmica de riesgo clínico o de autolesión, bajo ninguna circunstancia (RES-09).
* No generar texto de recomendaciones libremente con un LLM fuera del catálogo curado (RD-09), salvo en los casos explícitamente aprobados y con verificación (RF-37).
* No importar infraestructura (Supabase, Express, etc.) desde las capas de Dominio o Aplicación ([ADR-03](docs/architecture-decisions/03_Arquitectura_Software.md) §3.7).
* No importar `container.ts` ni ningún adaptador de `infrastructure/` desde un componente de React — los casos de uso corren en `api/` (servidor), la UI solo llama a esos endpoints por HTTP. `tsconfig.app.json` no lo impide a nivel de tipos (necesita los tipos de Node para `container.ts`), así que esta regla es de disciplina, no del compilador.
* No usar los alias `@shared/*`/`@modules/*` en ningún archivo alcanzable desde `api/*.ts` (es decir: todo `src/shared/` y las capas `domain/application/infrastructure` de cada módulo) — Vercel bundlea `api/` por separado de Vite y no resuelve esos alias (falla con "Cannot find package"), confirmado en producción. Usar imports relativos ahí. Los alias siguen bien para los componentes de `ui/` — esos sí los bundlea Vite, donde funcionan de verdad.
* No usar un ORM que duplique la validación que ya hace Zod en la capa de aplicación ([ADR-04](docs/architecture-decisions/04_Almacenamiento_Datos.md) §5).
* No añadir alcance nuevo (un RF, RD o RN) a los documentos sin confirmación explícita del usuario — proponer primero, escribir después.
* No aplicar Spec First (Nivel 1) como metodología de trabajo — ya descartado ([10_Enfoque_SDD.md](docs/requirements-analysis/10_Enfoque_SDD.md)).
* No usar *parameter properties* en constructores (`constructor(private readonly x: string)`) — `erasableSyntaxOnly` (activado en todos los `tsconfig`) lo prohíbe, porque Vite (esbuild) solo borra tipos, no genera código. Declarar el campo aparte y asignarlo en el cuerpo del constructor.
* No construir agentes autónomos ni integraciones MCP — fuera de alcance, ver [05_Fundamentos_IA.md](docs/architecture-decisions/05_Fundamentos_IA.md) §7.

---

## Historial de cambios

- **v1.0 (10 sept. 2026)** — versión inicial, adaptada de una plantilla de ejemplo compartida por el usuario (proyecto Pokédex/Next.js), consolidando en un único punto de entrada las convenciones y decisiones ya fijadas en los ADR y en `requirements-analysis`.
- **v1.1 (12 sept. 2026)** — se añade la prohibición de importar `container.ts`/`infrastructure/` desde React, tras habilitar los tipos de Node en `tsconfig.app.json` (Sprint 0, Task 3).
- **v1.2 (12 sept. 2026)** — tests movidos de estar colocados junto al código a `tests/` (misma estructura que `src/`). Se adopta TDD (red-green-refactor) como flujo obligatorio desde el Sprint 1.
- **v1.3 (13 sept. 2026)** — Sprint 1 (RF-01 registro): Material UI adoptado, Storybook aplazado ([06_Autenticacion.md](docs/architecture-decisions/06_Autenticacion.md) y [07_UI.md](docs/architecture-decisions/07_UI.md)). Se añade la carpeta `ui/` por módulo. Se documenta `npx vercel dev` para probar `api/` en local sin instalar `vercel` como dependencia (su árbol de dependencias trae vulnerabilidades conocidas). Se prohíben las *parameter properties* en constructores (`erasableSyntaxOnly`).
- **v1.4 (13 sept. 2026)** — cambio de MongoDB Atlas a Supabase (Postgres + Auth gestionada, ADR-04 v2.0/ADR-06 v2.0); RF-01 login añadido.
- **v1.5 (13 sept. 2026)** — corregido un fallo real en producción: los alias `@shared/@modules` no se resuelven en `api/*.ts` (Vercel bundlea aparte de Vite). Todo el código alcanzable desde `api/` pasa a imports relativos. Se añade observabilidad (logger estructurado, [08_Observabilidad.md](docs/architecture-decisions/08_Observabilidad.md)).
- **v1.6 (14 sept. 2026)** — RNF-10 implementado: i18n con react-i18next, sin texto hardcodeado en componentes ([09_Internacionalizacion.md](docs/architecture-decisions/09_Internacionalizacion.md)). Se añaden `Breadcrumbs` y `Header` como componentes de navegación reutilizables en `shared/ui/` ([07_UI.md](docs/architecture-decisions/07_UI.md) §5).
- **v1.7 (14 sept. 2026)** — se activa el versionado que esta sección ya prometía: `CHANGELOG.md` creado con la primera entrada `[0.1.0]`, `package.json` sube de `0.0.0` a `0.1.0`.
