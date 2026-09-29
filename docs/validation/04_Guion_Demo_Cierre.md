# Guion de la demo de cierre — Ciclo 1 (MVP)

**Para qué:** enseñar el MVP terminado al tutor (y, si es posible, a 2-3 personas no técnicas), como pide la técnica de validación "Demos frecuentes" del [plan de V&V](../requirements-analysis/04_Plan_Verificacion_Validacion.md), apartado 2. Es también el hito de la **primera entrega a producción** (`main`).
**Cuándo:** al final del proyecto, para la revisión de los profesores (decidido el 29 sept.: solo revisan el proyecto terminado). La primera entrega a producción (apartado 1.1) se hace ya, sin esperar a la demo.
**Duración:** unos 30 minutos (25 de demo + preguntas).
**Idea que tiene que quedar:** una app de bienestar que no juzga (RN-04), construida con disciplina de ingeniería (Clean Architecture, TDD, controles automáticos) y validada con una persona real, sin esconder sus límites.

---

## 1. Antes de la demo

### 1.1 Primera entrega a producción (una vez)

1. **Vercel → Settings → Environment Variables** (Production y Preview): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL` (la URL de producción) y, opcional, `RECOMMENDATION_THRESHOLD`. Sin ellas, las funciones de `api/` responden 500 ("Faltan SUPABASE_URL…").
2. **Supabase → Authentication → URL Configuration:** *Site URL* = la URL de producción; en *Redirect URLs*, `<URL de producción>/restablecer-password`.
3. **Datos:** producción y *previews* comparten el mismo proyecto de Supabase. Borrar las cuentas de prueba del desarrollo y crear la cuenta de administrador (SQL del [README](../../README.md), "Probar como administrador").
4. **Versión:** cerrar "[Sin publicar]" del CHANGELOG como versión y etiquetarla (propuesta: `1.0.0`, fin del `0.x` según AGENTS.md).
5. **PR `develop` → `main`** con los controles en verde (Vercel y "E2E con api"). Vercel despliega producción.
6. **Comprobación en la URL real:** registrarse, entrevista, Inicio, cerrar sesión, volver a entrar y eliminar esa cuenta.
7. **GitHub → Settings → Default branch:** volver a `main` (el *keep-alive* de Supabase se ejecuta desde la rama por defecto).

### 1.2 El día de la demo (30 minutos antes)

- [ ] Supabase no está pausado (panel de Supabase) y la URL de producción carga.
- [ ] **Cuenta "con historia"** preparada: categorías activas (4-6, alguna baja para que salga una idea), una entrevista guardada y el historial simulado de 12 meses ([scripts/sql/simulated-history.sql](../../scripts/sql/simulated-history.sql)). Con la sesión iniciada en una pestaña.
- [ ] **Cuenta de administrador** con al menos una categoría creada en los dos idiomas.
- [ ] Un **email nuevo** para registrarse en directo (p. ej. `demo+1@…`).
- [ ] Docker Desktop abierto (para el modo `--ui` de Playwright) y `npm run test:e2e:api` ejecutado una vez antes (descarga y caché listas).
- [ ] En el navegador, las herramientas de desarrollo en **modo móvil** a mano (o el móvil conectado a la pantalla).
- [ ] Pestañas abiertas: la app, GitHub (una PR con sus *checks*), este guion.
- [ ] **Plan B** si falla la red o producción: `npm run dev:local` (la misma app contra el Supabase local) y los vídeos de los tests (`E2E_VIDEO=1 npm run test:e2e:api`, en `test-results/`).

---

## 2. La demo

### 2.1 El problema (2 min)

- Evaluar cómo va tu vida por áreas suele sentirse como un examen. La app quiere ser **un espejo honesto, no un examen**: sin juicios, sin comparaciones con nadie (RN-04, RN-09 fuera de alcance).
- Qué hace el MVP: eliges áreas, te puntúas del 1 al 10, ves tu equilibrio y tu evolución, y recibes ideas concretas y amables para lo que tú decidas mejorar.

### 2.2 La app, como la usaría alguien nuevo (8 min)

| Paso | Qué enseñar | Qué decir |
|---|---|---|
| Portada | "Cómo funciona" en tres pasos; botón **EN** | La guía salió de la validación (UX-01). Inglés desde antes de tener cuenta. |
| Registro | Crear cuenta con el email nuevo | Entra directamente, sin volver a iniciar sesión. |
| Bienvenida | "Empezar mi entrevista" + los tres pasos | En vez de un panel vacío. |
| Entrevista | Marcar 3-4 áreas, **Deporte** (pide consentimiento, con enlace a la política), puntuar, "Guardar cambios" | Las categorías sensibles piden consentimiento explícito y versionado (RF-04). Se puede puntuar solo una parte. |
| Inicio (cuenta con historia) | "Cómo leer esta página", **Tu equilibrio** (radar), **Tu evolución** (12 meses), la banda en texto de cada tarjeta | Colores suaves y siempre con número y texto; el color nunca es la única señal. |
| Ideas para ti | Abrir una idea | Salen de un catálogo curado, con aviso de que no sustituyen el consejo profesional (RES-05). |
| Móvil | Modo móvil del navegador: cabecera con menú, gráficos compactos | Diseñada primero para móvil (RNF-06). |
| Privacidad | *Mi perfil → Privacidad y datos*: descargar mis datos | Derecho al olvido y portabilidad (RF-05): exportar en JSON y borrar la cuenta con la contraseña. |
| Administración | Cuenta de admin: catálogo con cada idioma, retirar sin borrar, auditoría | Las traducciones se guardan por id, no por columna: un idioma nuevo no cambia el esquema. |

### 2.3 Cómo está construida (8 min)

1. **Arquitectura:** monolito modular con Clean Architecture en cada módulo (dominio / aplicación / infraestructura), funciones serverless en Vercel y Supabase. Diagrama o árbol de `src/modules/` ([ADR-03](../architecture-decisions/03_Arquitectura_Software.md)).
2. **Especificación antes que código:** una historia de usuario Nivel 2 (Given/When/Then) por funcionalidad; enseñar una, p. ej. [RF-15](../user-stories/RF-15-radar-equilibrio.md).
3. **TDD y controles automáticos** ([AGENTS.md](../../AGENTS.md)):
   - Más de 400 tests (Vitest); la cobertura de la lógica de negocio es un control que bloquea (95-99 % hoy).
   - Husky: lint y tipos al hacer commit; el control completo (`npm run verify`) antes de cada `push`.
   - `check:api`: compila y **carga** cada función como lo hace Vercel.
4. **E2E de verdad, sin tocar datos reales:** `npm run test:e2e:api -- --ui` en directo. Un Supabase local en Docker, los mismos tests en móvil y escritorio. Enseñar el "viaje en el tiempo" de un test (el del consentimiento es el más visual).
5. **En cada PR:** la pestaña *Checks* de GitHub con "E2E con api" en verde.

### 2.4 Validación y métricas (5 min)

- **Test de usabilidad** ([resultados](02_Resultados_Test_Usabilidad.md)): una participante, en inglés. No se sintió juzgada (4/5) y volvería (5/5). Su frase: *"something you can trust to share a part of you, not to be judged but to be guided"*. Necesitó ayuda al principio: de ahí la guía de primer uso (UX-01) y destacar las ideas (UX-02).
- **Métricas DORA y Flow** ([resultados](../project-management/02_Metricas_DORA_y_Flujo.md), apartado 7): 11 PRs en 16 días; 6 fallos, 5 parados por los controles antes de fusionar. El único que llegó a `develop` estuvo 8 días sin detectarse porque un aviso del compilador se silenció en vez de corregirse. De ahí salieron dos reglas nuevas y un control que hoy lo pararía.
- **Límites, dichos en voz alta:** n = 1 y participante cercana; métricas de una sola persona, no comparables con las bandas de DORA.

### 2.5 Lo que viene (2 min)

- **Ciclo 2:** RF-40 (ideas personalizadas con IA, ancladas al catálogo, con verificación automática y caída al texto curado, sin moderador humano; [ADR-05](../architecture-decisions/05_Fundamentos_IA.md), apartado 4.3), perfil ampliado (con los datos de salud y religión como categoría especial del RGPD) y una pregunta abierta por categoría. Las tres salen de la validación.
- La línea que no se cruza: nada de detección algorítmica de riesgo clínico (RES-09).

---

## 3. Preguntas probables

| Pregunta | Respuesta corta | Dónde está |
|---|---|---|
| ¿Por qué no un LLM que escriba las recomendaciones? | Riesgo de lenguaje diagnóstico o de consejo profesional. En el Ciclo 2 la IA reescribe ideas del catálogo, con verificación automática y caída al texto curado. | ADR-05, apartado 4.3 |
| ¿Por qué Clean Architecture en un MVP? | Decisión consciente: el objetivo del TFM incluye aplicar la arquitectura, y permite probar la lógica sin base de datos (Fakes). | ADR-03, apartado 5 |
| ¿Qué pasa con los datos sensibles? | Consentimiento explícito y versionado por categoría, RLS activado, *service role key* solo en el servidor, exportación y borrado completos. | RF-04, RF-05, ADR-04 |
| ¿Cómo sabéis que funciona en producción y no solo en local? | `check:api` carga las funciones como Vercel, y los E2E con base de datos real (local) corren en cada PR. Lección aprendida con un fallo real. | Métricas, apartado 7.2 |
| ¿Por qué una sola participante? | Era la persona disponible; está documentado como limitación y se buscaron problemas graves, no medir. | Resultados del test, apartado 6 |
| ¿Por qué no Sentry u otro servicio de errores? | A esta escala basta el logger estructurado y los logs de Vercel (RES-03, YAGNI). | ADR-08 |
| ¿Límites del plan gratuito? | 12 funciones en Vercel Hobby (una por capacidad) y pausa de Supabase tras 7 días (workflow diario). | ADR-03, apartado 6.1 |

## 4. Después de la demo

- Anotar las preguntas y comentarios literales del tutor en una sección nueva de este documento (qué preguntó, qué se respondió, qué cambia).
- Lo que salga se clasifica como en la validación: problemas al tablero, ideas a "Primeras historias del Ciclo 2".
- Siguiente revisión de métricas con la primera entrega real a `main` (métricas, apartado 7.6).

---

## Historial de cambios

- **v1.0 (29 sept. 2026)** — versión inicial: preparación (incluida la primera entrega a producción), guion de 25 minutos, preguntas probables y qué hacer después.
- **v1.1 (29 sept. 2026)** — la demo pasa al final del proyecto; la lista de la primera entrega a producción (apartado 1.1) se usa ya.
