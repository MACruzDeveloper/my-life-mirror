# 🤖 Instrucciones para el Asistente de IA — MyLifeMirror

Este documento da contexto general del proyecto a cualquier asistente de IA (o persona) que trabaje en este repositorio. Es un punto de entrada, no una duplicación — cada sección enlaza al documento que tiene el detalle completo.

---

## 📌 Propósito y Rol

* **Objetivo principal**: asistir en el desarrollo de **MyLifeMirror**, una app de autoevaluación y mejora de vida por categorías — TFM del Máster en Desarrollo con IA (BIG School).
* **Rol**: actuar como desarrollador experto en TypeScript/React/Node aplicando Clean Architecture dentro de un Monolito Modular, y como copiloto de la documentación técnica del propio TFM.

## 🛠️ Restricciones y Alcance

* **Tecnologías**: TypeScript + React + Node ([ADR-01](docs/architecture-decisions/01_Stack_Tecnologico.md)). Python solo para el script offline de generación de avatares (ADR-01 apartado 7) — nunca en el runtime de producción.
* **Base de datos y autenticación**: Supabase (Postgres + Auth gestionada) — sustituyó a MongoDB Atlas ([ADR-04](docs/architecture-decisions/04_Almacenamiento_Datos.md) v2.0). Autenticación vía `AuthProvider`/Supabase Auth, nunca hash o JWT propios ([ADR-06](docs/architecture-decisions/06_Autenticacion.md)). Zod sigue siendo la fuente de verdad de los DTOs en la capa de aplicación.
* **Arquitectura**: Monolito Modular — módulos = capacidades de negocio (Cuentas, Categorías, Evaluaciones, Recomendaciones...) —, con Clean Architecture completa dentro de cada uno (dominio/aplicación/infraestructura). Empezar cada módulo con la estructura mínima, no la granularidad completa desde el primer commit ([ADR-03](docs/architecture-decisions/03_Arquitectura_Software.md) apartado 3.5). Cada módulo añade también una carpeta `ui/` para sus componentes React — es la capa de entrega, fuera de las tres capas de Clean Architecture; nunca importa `infrastructure/` directamente (ver Prohibiciones).
* **`api/`**: subcarpetas por capacidad de negocio (`accounts/`, `categories/`, `consent/`...), reflejando `src/modules/`. Vercel soporta rutas anidadas de forma nativa (carpeta → segmento de URL) — no hay motivo para mantenerlo plano. Un archivo dentro de una subcarpeta usa una `../../` extra en sus imports relativos hacia `src/` (un nivel más de profundidad).
* **Principios de código**: SOLID, DRY, KISS, YAGNI, y comprobar la alternativa nativa antes de aplicar un patrón de diseño ([ADR-02: Principios de Diseño](docs/architecture-decisions/02_Principios_Diseño.md)).
* **Metodología de especificación**: cada historia de usuario se escribe primero en formato Nivel 2 (Spec Anchored) — Given/When/Then, referenciada a su RF/RD — antes de escribir código. Nivel 3 solo si el objetivo es muy claro y el desafío es de tamaño medio/complejo ([10_Enfoque_SDD.md](docs/requirements-analysis/10_Enfoque_SDD.md)).
* **Metodología de trabajo**: Lean + Kanban con apetito fijo (31 oct.), no sprints — el tablero está en [01_Backlog_MVP.md](docs/project-management/01_Backlog_MVP.md) y el porqué en [00_Metodologia_Lean.md](docs/project-management/00_Metodologia_Lean.md). Se tira de arriba de "Listo" (WIP ≤ 2); si el tiempo no llega, se recorta por la línea de corte, nunca se estira el plazo. No reintroducir "Sprint N" en docs ni comentarios.
* **Idioma**: la conversación con el usuario es en español (desde el 3 oct. 2026; antes, en inglés); todos los documentos `.md` entregables se escriben en español; el código (identificadores, nombres de archivo, mensajes de commit) en inglés.
* **i18n de la interfaz** (RNF-10): ningún texto visible para el usuario se escribe a mano dentro de un componente — siempre `t("namespace.clave")` de `react-i18next`, con la clave añadida a la vez en `src/shared/ui/i18n/locales/es.json` y `en.json` ([ADR-09](docs/architecture-decisions/09_Internacionalizacion.md)). El idioma por defecto es español; el cambio es manual (selector en el `Header`), sin detección automática del navegador.
* **Mobile-first** (RNF-06): todo `sx`/estilo nuevo se escribe primero para móvil (sin prefijo de breakpoint) y se adapta hacia arriba con `{ xs, sm, md, ... }` de MUI — nunca al revés ([07_UI.md](docs/architecture-decisions/07_UI.md) apartado 6). Toda pantalla protegida nueva usa `ProtectedLayout` (`shared/ui/`) en vez de montar `Header`/`Breadcrumbs` a mano.
* **Datos del servidor en el frontend** ([07_UI.md](docs/architecture-decisions/07_UI.md) v1.14-v1.16): toda pantalla o pestaña que lea de la API usa la caché de TanStack Query (`useQuery`, claves en `modules/*/ui/queries.ts`), nunca un `fetch` en `useEffect`. La caché no caduca por tiempo; cada acción que cambie datos los actualiza o invalida (`setQueryData` / `invalidateQueries`). Volver a una pantalla no debe repetir la llamada, y los tests lo comprueban (`withClient`, `tests/helpers/queryClient.tsx`). Los cambios sobre categorías no sensibles son optimistas. La caché se vacía al iniciar sesión.
* **Funciones serverless** ([ADR-03](docs/architecture-decisions/03_Arquitectura_Software.md) apartado 6.1): Vercel Hobby permite 12; una función por capacidad, no por acción — las acciones nuevas van al `[action].ts` de su capacidad (`createRouter`). `npm run check:api` lo vigila.
* **Listas de valores** (estados, roles, géneros, motivos…): una sola vez, junto a su concepto, como lista `as const` con el tipo derivado de ella (`export const USER_ROLES = ["usuario", "premium", "admin"] as const; export type UserRole = (typeof USER_ROLES)[number];`); validaciones (`z.enum(USER_ROLES)`) e interfaz la importan, nunca la copian. Sin archivo global de constantes: acoplaría módulos que no tienen nada que ver. Si la lista es privada de un archivo y solo se usa como tipo, basta el tipo.
* **Contenido curado como datos** (CAT-01): ideas del catálogo, situaciones de RF-42 y sus choques, opciones de "¿Qué te ayuda?", términos del filtro de IA y términos ofensivos de RF-45 viven en JSON en `domain/catalog/` de su módulo (una fila por elemento, con su clave estable, como las futuras tablas de ADM-04), no como constantes en el código; los textos visibles, en las traducciones. Los tests de integridad del catálogo avisan si se edita mal. Para leer un JSON desde código del servidor: `import x from "./catalog/x.json" with { type: "json" };`.
* **Iconos**: siempre de `@mui/icons-material`, importando cada uno por su ruta (`import MenuIcon from "@mui/icons-material/Menu"`, así solo entra en el bundle el que se usa); nunca un `SvgIcon` con el `path` copiado a mano.
* **Estructura del frontend**: los gráficos son plantillas genéricas en `src/shared/ui/charts/` (una carpeta por tipo, configurables por props, ciclo de vida común en `useEChart`); lo específico de un dominio va en una subcarpeta de su módulo (p. ej. `assessments/ui/evolution/`); una página con varios estados se divide en subcomponentes (p. ej. `panel/ui/home/`).
* **Idioma del código**: identificadores y nombres de archivo en inglés (`RegisterUser.ts`, `ProfileForm.tsx`...) — **también las variables locales, estados, props y funciones internas** (`firstTimeUser`, no `primeraVez`); las claves de i18n se quedan como están; comentarios y documentación siguen en español. Pase completo hecho el 29 sept. 2026 (módulos `accounts`, `consent`, `wellbeing`…). **Se quedan en español a propósito**, porque cambiarlos rompería datos o contratos: columnas y tablas de la base de datos (`usuario_id`, `consentimientos`), claves de categoría (`economia`, `vidaSocial`), claves y variables de i18n (`{{categoria}}`), la cookie `sesion`, y los campos JSON de la API que lee el navegador (`autenticado`, `sesionIniciada`, `rol`, `creadoEn`, `ultimoAcceso`, `suspendido`, `mensaje`): estos últimos, si se cambian, en un cambio aparte que toque servidor y cliente a la vez.

## 🚀 Comandos

* `npm run dev` — servidor de desarrollo (Vite; solo frontend, no ejecuta `api/`).
* `npx -y vercel dev` — frontend + funciones de `api/` juntos (necesita `npx vercel link` una vez, con tu cuenta de Vercel). El `-y` evita el prompt interactivo de npm la primera vez que descarga el paquete ("Ok to proceed?") — sin él, `npm run dev:full` puede quedarse esperando una confirmación que nunca llega si la terminal no es interactiva. No se instala `vercel` como dependencia del proyecto — su árbol de dependencias trae paquetes de soporte para decenas de frameworks con vulnerabilidades conocidas; se usa vía `npx` (o instalado globalmente en tu máquina), igual que la mayoría de CLIs de este tipo.
* `npm run dev:local` — la app completa (frontend + `api/`) contra el **Supabase local en Docker** (http://localhost:5175), sin cuentas ni `.env`: la forma de probarla sin tocar la base real (ver [README.md](README.md)).
* `npm run dev:full` — igual que `vercel dev`, pero abre el navegador automáticamente (macOS, comando `open` nativo — `vercel dev` no tiene un flag `--open` propio).
* `npm run build` — build de producción (`tsc -b && vite build`).
* `npm run lint` — ESLint. `npm run typecheck` — solo `tsc -b`.
* `npm run test:coverage` — Vitest con cobertura; **falla** si la lógica de negocio (`domain/` + `application/`) baja de 90 % sentencias / 80 % ramas / 95 % funciones / 95 % líneas (`vite.config.ts`). El resto se mide pero no bloquea.
* `npm run verify` — el *quality gate* completo: lint, tests con cobertura, build, `check:api` y e2e (~40 s).
* **Hooks de Husky** (se instalan solos con `npm install`): `pre-commit` = lint + typecheck; `pre-push` = `npm run verify`. `--no-verify` solo en emergencias, y anotándolo. Con un cliente Git gráfico (Fork…) y Node instalado con nvm, el hook no encuentra `npm` (no lee `~/.zshrc`): se arregla una vez por máquina con `~/.config/husky/init.sh` cargando `$NVM_DIR/nvm.sh`, que Husky ejecuta antes de cada hook.
* `npm run preview` — sirve el build de producción localmente.
* `npm run test` / `npm run test:watch` — Vitest. Todos los tests viven en `tests/`, con la misma estructura de carpetas que `src/` (nunca colocados junto al archivo que prueban) — p. ej. `src/shared/domain/Result.ts` se prueba en `tests/shared/domain/Result.test.ts`. React Testing Library ya en uso para componentes.
* `npm run test:e2e` — Playwright, tests en `e2e/` (no en `tests/` — es un tipo de test distinto, contra un navegador real, no contra Vitest). Arranca `vite` solo (puerto 5173) automáticamente — sirve para lo que no toca `api/`. Va en el pre-push.
* `npm run smoke:prod` — comprueba producción (https://my-life-mirror.vercel.app) sin crear datos: rutas de la app al recargar, funciones en Dublín y conexión con Supabase. Se ejecuta solo tras cada despliegue de producción (workflow *Smoke producción*); a mano, `node scripts/smoke-prod.mjs <url>` sirve para otra URL.
* `npm run test:e2e:api` — Playwright con `api/` (tests en `e2e/api/`, Page Objects en `e2e/api/pages/`) contra un **Supabase local en Docker** (Docker Desktop abierto), que se vacía en cada ejecución. Lo sirve un plugin de Vite que se niega a arrancar si la base no es local; **nunca usar `vercel dev` para esto**: carga siempre el `.env` real. Se ejecuta solo en las PRs a `main` hasta final de octubre de 2026, luego en todas (GitHub Actions, `.github/workflows/e2e-api.yml`) y a mano cuando se quiera (~35 s; `-- --ui` para verlo). Detalle en [04_Plan_Verificacion_Validacion.md](docs/requirements-analysis/04_Plan_Verificacion_Validacion.md) apartado 1.2.

## 🔴🟢 TDD (obligatorio desde RF-01)

Cada pieza nueva (Entidad, Value Object, caso de uso, adaptador) se construye en este orden, sin excepción:

1. Escribir el test en `tests/` primero — con Fakes si hace falta un doble de una dependencia (preferidos sobre Mocks, ADR-03 apartado 3.6).
2. Ejecutarlo y comprobar que falla (el código todavía no existe o no cumple el test).
3. Escribir el código mínimo para que pase.
4. Refactorizar si hace falta, sin romper el test.

No se escribe implementación antes que su test correspondiente.

## ✅ Tareas Clave

* Redactar las historias de usuario del Ciclo 1 en formato Nivel 2 (Spec Anchored).
* Implementar cada historia como un Caso de Uso de la capa de Aplicación, con su Entidad/Value Object en Dominio y su adaptador en Infraestructura.
* Empezar cada módulo con un adaptador de repositorio en memoria antes que la conexión real a Supabase, salvo el propio proveedor de autenticación, que usa Supabase real también en `dev` (sin sustituto en memoria razonable, ADR-06 apartado 1).
* Generar boilerplate repetitivo (esquemas Zod, mapeadores Entidad↔documento, dobles de test/Fakes para los puertos) cuando se pida — siempre a revisar por el usuario antes de darse por bueno.
* Mantener actualizados los documentos de `docs/requirements-analysis/` y `docs/architecture-decisions/` cuando una decisión cambie.

## 📖 Documentación y Control de Versiones

* Cada documento de `docs/` conserva su contenido y añade una sección **"Historial de cambios"** al final en vez de sobrescribirse en silencio.
* [docs/README.md](docs/README.md) es el mapa de la documentación: todo documento nuevo se añade ahí, y sigue sus reglas de crecimiento (una historia por funcionalidad, ADR solo para decisiones nuevas, lo pendiente solo en el tablero, nada de apartados "Próximo paso").
* Un apartado nuevo entre dos existentes es un subapartado decimal del anterior (`### 2.1`, `### 2.2`…), nunca "2bis"/"2ter". Las referencias se escriben con la palabra: "ADR-03, apartado 6.1", sin el símbolo de sección.
* [docs/Historial_Prompts.md](docs/Historial_Prompts.md) registra cada prompt que fija una decisión de diseño, proceso o alcance — no cada mensaje.
* `package.json` sube de versión siguiendo [SemVer](https://semver.org/lang/es/) en cada cambio significativo, y [CHANGELOG.md](CHANGELOG.md) registra los cambios siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) — el mismo espíritu que ya se aplica a los documentos, extendido al código. Desde la `1.0.0` (primera entrega a producción, 29 sept. 2026): MINOR = nueva funcionalidad, PATCH = corrección, MAJOR = un cambio que obligue a migrar datos o rompa lo existente. Cada entrega a `main` es una versión con su sección en el CHANGELOG y su etiqueta (`v1.1.0`…).
* Commits/push solo cuando el usuario lo pida explícitamente.

## 🚫 Prohibiciones

* No implementar detección algorítmica de riesgo clínico o de autolesión, bajo ninguna circunstancia (RES-09).
* No generar texto de recomendaciones libremente con un LLM fuera del catálogo curado (RD-09), salvo en los casos explícitamente aprobados y con verificación (RF-37, y RF-40: reescritura de ideas del catálogo con verificación automática y caída al texto curado, [05_Fundamentos_IA.md](docs/architecture-decisions/05_Fundamentos_IA.md) apartado 4.3).
* No importar infraestructura (Supabase, Express, etc.) desde las capas de Dominio o Aplicación ([ADR-03](docs/architecture-decisions/03_Arquitectura_Software.md) apartado 3.7).
* No importar `container.ts` ni ningún adaptador de `infrastructure/` desde un componente de React — los casos de uso corren en `api/` (servidor), la UI solo llama a esos endpoints por HTTP. `tsconfig.app.json` no lo impide a nivel de tipos (necesita los tipos de Node para `container.ts`), así que esta regla es de disciplina, no del compilador.
* No usar los alias `@shared/*`/`@modules/*` en ningún archivo alcanzable desde `api/*.ts` (todo `src/shared/` y las capas `domain/application/infrastructure` de cada módulo): Vercel compila `api/` sin Vite y no los resuelve ("Cannot find package", 13 sept.). **Ahí se usan los imports nativos de Node `#shared/…` y `#modules/…`**, declarados en la sección `imports` de `package.json`, siempre con extensión `.js` (`from "#shared/domain/Result.js"`, aunque el archivo sea `.ts`): el paquete es `"type": "module"` y Vercel ejecuta ESM nativo. Regla: hacia `src/shared/` → `#shared/…`; hacia otro módulo → `#modules/<módulo>/…`; dentro del mismo módulo, relativo (`../domain/X.js`). Comprobado con un `vercel build` real (3 oct.) y vigilado por `npm run check:api`, que comprueba los tipos con `nodenext` y carga cada función con el mismo mapeo. Los alias `@` siguen para los componentes de `ui/`, que bundlea Vite.
* No usar un ORM que duplique la validación que ya hace Zod en la capa de aplicación ([ADR-04](docs/architecture-decisions/04_Almacenamiento_Datos.md) apartado 5).
* No dar por válido un adaptador en memoria para un dato que se escribe desde una función de `api/` y se lee desde otra — cada archivo de `api/` es una función serverless aislada, sin memoria compartida entre sí (ni en producción ni en `vercel dev`); ese dato necesita Supabase real desde el principio, no "en memoria hasta el final" ([ADR-04](docs/architecture-decisions/04_Almacenamiento_Datos.md) apartado 5.1 — bug real encontrado con RF-03).
* No añadir alcance nuevo (un RF, RD o RN) a los documentos sin confirmación explícita del usuario — proponer primero, escribir después.
* No aplicar Spec First (Nivel 1) como metodología de trabajo — ya descartado ([10_Enfoque_SDD.md](docs/requirements-analysis/10_Enfoque_SDD.md)).
* No usar *parameter properties* en constructores (`constructor(private readonly x: string)`) — `erasableSyntaxOnly` (activado en todos los `tsconfig`) lo prohíbe, porque Vite (esbuild) solo borra tipos, no genera código. Declarar el campo aparte y asignarlo en el cuerpo del constructor.
* No construir agentes autónomos ni integraciones MCP — fuera de alcance, ver [05_Fundamentos_IA.md](docs/architecture-decisions/05_Fundamentos_IA.md) apartado 7.
* No exponer ningún endpoint o caso de uso que permita a un usuario cambiar su propio `rol` (RNF-13) — admin/premium se conceden a mano vía `app_metadata` de Supabase (service role key), nunca desde algo que el cliente pueda invocar ([06_Autenticacion.md](docs/architecture-decisions/06_Autenticacion.md) apartado 1.1).

---

## Historial de cambios

- **v1.0 (10 sept. 2026)** — versión inicial, adaptada de una plantilla de ejemplo compartida por el usuario (proyecto Pokédex/Next.js), consolidando en un único punto de entrada las convenciones y decisiones ya fijadas en los ADR y en `requirements-analysis`.
- **v1.1 (12 sept. 2026)** — se añade la prohibición de importar `container.ts`/`infrastructure/` desde React, tras habilitar los tipos de Node en `tsconfig.app.json` (Sprint 0, Task 3).
- **v1.2 (12 sept. 2026)** — tests movidos de estar colocados junto al código a `tests/` (misma estructura que `src/`). Se adopta TDD (red-green-refactor) como flujo obligatorio desde el Sprint 1.
- **v1.3 (13 sept. 2026)** — Sprint 1 (RF-01 registro): Material UI adoptado, Storybook aplazado ([06_Autenticacion.md](docs/architecture-decisions/06_Autenticacion.md) y [07_UI.md](docs/architecture-decisions/07_UI.md)). Se añade la carpeta `ui/` por módulo. Se documenta `npx vercel dev` para probar `api/` en local sin instalar `vercel` como dependencia (su árbol de dependencias trae vulnerabilidades conocidas). Se prohíben las *parameter properties* en constructores (`erasableSyntaxOnly`).
- **v1.4 (13 sept. 2026)** — cambio de MongoDB Atlas a Supabase (Postgres + Auth gestionada, ADR-04 v2.0/ADR-06 v2.0); RF-01 login añadido.
- **v1.5 (13 sept. 2026)** — corregido un fallo real en producción: los alias `@shared/@modules` no se resuelven en `api/*.ts` (Vercel bundlea aparte de Vite). Todo el código alcanzable desde `api/` pasa a imports relativos. Se añade observabilidad (logger estructurado, [08_Observabilidad.md](docs/architecture-decisions/08_Observabilidad.md)).
- **v1.6 (14 sept. 2026)** — RNF-10 implementado: i18n con react-i18next, sin texto hardcodeado en componentes ([09_Internacionalizacion.md](docs/architecture-decisions/09_Internacionalizacion.md)). Se añaden `Breadcrumbs` y `Header` como componentes de navegación reutilizables en `shared/ui/` ([07_UI.md](docs/architecture-decisions/07_UI.md) apartado 5).
- **v1.7 (14 sept. 2026)** — se activa el versionado que esta sección ya prometía: `CHANGELOG.md` creado con la primera entrada `[0.1.0]`, `package.json` sube de `0.0.0` a `0.1.0`.
- **v1.8 (14 sept. 2026)** — RF-04 (consentimiento) cierra el Sprint 1. Se añaden roles de usuario (RNF-13): prohibido exponer un endpoint que permita a un usuario cambiar su propio rol.
- **v1.9 (14 sept. 2026)** — Sprint 2 iniciado (RF-03, perfil). Se adopta mobile-first (RNF-06) y `ProtectedLayout` como estándar para pantallas protegidas nuevas.
- **v1.10 (14 sept. 2026)** — código y nombres de archivo pasan a inglés desde ahora (comentarios/docs siguen en español, boy scout rule para lo ya existente). `edad` (entero) sustituida por `birthDate`; `name` se captura ya en el registro (RF-01) en vez de esperar a la pantalla de perfil.
- **v1.11 (14 sept. 2026)** — dos fallos reales encontrados en pruebas manuales: `useSesion`→`SessionContext` (el Header no se refrescaba tras guardar el perfil) y `ProfileRepository`/`ConsentimientoRepository` pasan a Supabase real ya, no en el Sprint 5 (en memoria no sobrevive entre funciones de `api/` distintas). Nueva prohibición sobre cuándo un adaptador en memoria deja de ser válido.
- **v1.12 (15 sept. 2026)** — `npm run dev:full` se quedaba colgado en el prompt interactivo de `npx` ("Ok to proceed?") la primera vez que necesitaba descargar `vercel`; se añade `-y`.
- **v1.13 (15 sept. 2026)** — RF-06/RF-07 (categorías) completado; disparador real de RF-04 conectado por fin. Persistencia Supabase desde el principio, sin repetir el error de RF-03.
- **v1.14 (15 sept. 2026)** — reorganización estructural: `api/` en subcarpetas por capacidad de negocio (Vercel soporta rutas anidadas de forma nativa); `shared/ui/` agrupado por tipo (`components/`, `context/`, `css/`, `i18n/`); historias de usuario en `docs/user-stories/sprint-N/`; Perfil y Categorías consolidados en una pantalla con pestañas (`AccountPage`), Header pasa de dos enlaces a uno ("Mi perfil"); nueva `PrivacyPolicyPage` enlazada desde el modal de consentimiento (RNF-05).
- **v1.15 (15 sept. 2026)** — Playwright instalado (`e2e/`, `npm run test:e2e`), con `tsconfig.e2e.json` propio para que se typecheque en `npm run build`. Primer test cubre solo páginas públicas — automatizar RF-01 (el caso que motivó la lección de apartado 5.1 en ADR-04) queda pendiente de decidir aislamiento de datos de prueba en Supabase.
- **v1.16 (19 sept. 2026)** — se abandonan los sprints semanales por Lean + Kanban con apetito fijo y línea de corte ([00_Metodologia_Lean.md](docs/project-management/00_Metodologia_Lean.md)). `docs/user-stories/` vuelve a ser plano. Las menciones históricas de "Sprint N" en los historiales de cambios anteriores se dejan como registro de lo que era cierto entonces.
- **v1.17 (20 sept. 2026)** — reglas nuevas: caché de datos del servidor en toda pantalla que lea de la API, y límite de 12 funciones serverless (una por capacidad).
- **v1.18 (26 sept. 2026)** — estructura del frontend (plantillas de gráficos en `shared/ui/charts/`, subcarpetas por dominio, páginas divididas en subcomponentes) y aclaración de que el inglés alcanza también a las variables locales.
- **v1.19 (27 sept. 2026)** — RF-40 se añade a las excepciones aprobadas de la prohibición sobre texto generado con LLM.
- **v1.20 (27 sept. 2026)** — Husky: `pre-commit` (lint + tipos) y `pre-push` (`npm run verify`), con umbral de cobertura sobre dominio + aplicación.
- **v1.21 (27 sept. 2026)** — iconos de `@mui/icons-material` en lugar de SVG copiados a mano.
- **v1.22 (27 sept. 2026)** — imports relativos con `.js` en todo lo alcanzable desde `api/` (fallo real en la *preview*: las funciones no arrancaban); `check:api` pasa a `nodenext` y carga cada función en Node.
- **v1.23 (27 sept. 2026)** — `npm run test:e2e:api`: E2E con `api/` contra Supabase local en Docker (nunca `vercel dev`, que carga la base real).
- **v1.24 (28 sept. 2026)** — `npm run dev:local` (probar la app contra el Supabase local), E2E con `api/` en GitHub Actions y numeración decimal de apartados en lugar de "bis/ter" (referencias actualizadas en todo el repositorio).
- **v1.25 (29 sept. 2026)** — referencias a apartados con la palabra "apartado" en lugar del símbolo de sección, en todo el repositorio.
- **v1.26 (29 sept. 2026)** — versión 1.0.0 (primera entrega a producción): reglas de SemVer a partir de ahora.
- **v1.27 (29 sept. 2026)** — `npm run smoke:prod` y workflow *Smoke producción* tras el fallo de rutas de la v1.0.0.
- **v1.28 (29 sept. 2026)** — código en inglés en un pase completo (con las excepciones que rompen datos o contratos), y E2E con `api/` solo en las PRs a `main` hasta final de octubre.
- **v1.29 (29 sept. 2026)** — `docs/README.md` como mapa de la documentación y sus reglas de crecimiento; fuera los apartados "Próximo paso".
- **v1.30 (3 oct. 2026)** — convención de listas de valores `as const` en un solo sitio (tras encontrar los roles copiados en 4 sitios y el género en 3).
- **v1.31 (3 oct. 2026)** — la conversación pasa a español, a petición del autor ("el proyecto está en una fase importante y necesito entender todo bien"); el código sigue en inglés.
- **v1.32 (3 oct. 2026)** — imports `#shared/…`/`#modules/…` (imports nativos de Node, `package.json`) en todo lo alcanzable desde `api/`, en lugar de rutas relativas largas; probado con un `vercel build` real antes de convertir 265 imports.
- **v1.33 (5 oct. 2026)** — contenido curado como datos en `domain/catalog/` de cada módulo (CAT-01), en lugar de constantes en el código y sin archivo global de constantes.
