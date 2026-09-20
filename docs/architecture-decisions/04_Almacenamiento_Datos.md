# ADR-04: Almacenamiento de Datos

**Estado:** Aceptado
**Fecha:** 10 de septiembre de 2026
**Relacionado con:** [01_Stack_Tecnologico.md](01_Stack_Tecnologico.md), [02_Principios_Diseño.md](02_Principios_Diseño.md), [03_Arquitectura_Software.md](03_Arquitectura_Software.md), [06_Autenticacion.md](06_Autenticacion.md), [05_Diagrama_Clases.md](../requirements-analysis/05_Diagrama_Clases.md), RES-03, RES-04, RNF-04, RNF-05, RNF-11, RNF-12, RF-03, RF-04, RF-34

---

## 1. Contexto

RES-03 exige capa gratuita, sin excepciones. El modelo de dominio ([05_Diagrama_Clases.md](../requirements-analysis/05_Diagrama_Clases.md)) es bastante relacional (relaciones tipo FK, `Conexión` autorreferencial), y RF-34 necesita filtrar el historial de recomendaciones por estado, categoría y fecha a la vez. RES-04/RD-06 exigen tratamiento reforzado para categorías de datos especial (Art. 9 RGPD); RNF-11 pide auditoría de accesos/modificaciones a esos datos.

Gracias a [03_Arquitectura_Software.md](03_Arquitectura_Software.md) (Clean Architecture, patrón Repository como puerto), esta decisión queda parcialmente protegida: la base de datos concreta vive por completo dentro del adaptador de infraestructura, sin filtrarse al dominio ni a la aplicación.

## 2. Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Firebase (Firestore)** | Tiempo real maduro, Cloud Functions en Node/TS nativo | RF-34 choca con las limitaciones reales de Firestore (no permite combinar filtros de desigualdad en varios campos en una sola consulta) |
| **MongoDB Atlas** | El usuario ya lo conocía; capa gratuita M0 permanente, sin auto-pausa; su lenguaje de consultas resuelve RF-34 sin problema | Sin autenticación incluida (obligaba a construir hash + sesión a mano, ver [06_Autenticacion.md](06_Autenticacion.md)); sin esquema forzado; sin RLS |
| **Autoalojado (Postgres/Mongo en una VM propia)** | Control total | Carga operativa (backups, parches, escalado) desproporcionada para RES-02 |
| **Supabase (Postgres)** ✅ | Encaje natural con el modelo relacional, RLS potente, SQL resuelve RF-34 sin esfuerzo, **incluye autenticación gestionada** (elimina la necesidad de construirla a mano) | Tier gratuito se autopausa tras ~1 semana de inactividad; tecnología nueva para el usuario |

## 3. Decisión: Supabase (Postgres + Auth gestionada)

Se sustituye MongoDB Atlas por Supabase. El motivo ya no es solo el encaje relacional (siempre lo tuvo mejor) — es que **Supabase incluye autenticación gestionada**, lo que elimina de raíz la necesidad de construir hash de contraseñas y gestión de sesión a mano (ver [06_Autenticacion.md](06_Autenticacion.md)), reduciendo superficie de código sensible a la seguridad justo en la parte del sistema donde eso más importa.

El cambio se hace en el punto más barato posible: se decide antes de haber construido el adaptador real de MongoDB (previsto para el final del Ciclo 1, nunca llegó a escribirse) y con el registro (RF-01) todavía cubierto solo por adaptadores en memoria — el patrón Repository/puerto ya aislaba esta decisión del resto del sistema, tal como se pretendía.

Sobre el coste económico: el tier gratuito de Supabase se autopausa tras ~1 semana de inactividad (a diferencia de Atlas) — aceptable dado que el proyecto ya está en fase activa de implementación; un pause ocasional se reactiva con un clic o la primera petición.

## 4. Cómo se cubren los requisitos con Supabase

| Necesidad | Cómo la cubre Supabase |
|---|---|
| **Esquema de datos** | Postgres fuerza el esquema a nivel de columna — Zod sigue validando en la frontera de la aplicación (DTOs), pero ya no es la única red de seguridad como lo era con MongoDB. |
| **`Conexión` autorreferencial** | FK estándar de SQL — trivial, sin el rodeo de `$lookup` que hacía falta en MongoDB. |
| **RF-34** (filtros combinados estado/categoría/fecha) | Una consulta SQL indexada, sin las limitaciones de Firestore ni el modelado manual de MongoDB. |
| **Autorización** (sustituye la ausencia de RLS de MongoDB) | Row-Level Security de Postgres, nativo de Supabase — refuerza, no sustituye, la autorización ya prevista en la capa de Casos de Uso. |
| **Auditoría** (RNF-11) | Igual que en la decisión anterior: un caso de uso `RegistrarAuditoria` explícito vía evento de dominio/Outbox ([03_Arquitectura_Software.md](03_Arquitectura_Software.md) §3.4) — Supabase no cambia esta pieza. |
| **Cifrado de campos sensibles** (RES-04, RD-06) | Cifrado a nivel de aplicación para los campos marcados como sensibles, igual que antes — no se implementa nada adicional específico de Postgres todavía (YAGNI). |
| **Exportación de datos** (RNF-12) | SQL → JSON/CSV es tooling estándar. |

## 5. Detalle de implementación

- **Cliente:** `@supabase/supabase-js`, el SDK oficial.
- **Autenticación:** ver [06_Autenticacion.md](06_Autenticacion.md) — Supabase Auth gestiona contraseñas y sesión; no se toca directamente Postgres para eso.
- **Datos propios de la app** (perfil, categorías, evaluaciones...): una tabla por Aggregate Root, accedida a través de un `Repository` por puerto, igual disciplina que ya establecía ADR-03 — el adaptador concreto (`SupabaseXRepository`) es el único código con permiso para importar el cliente de Supabase para esos datos.
- **Entorno de desarrollo/test**: adaptadores en memoria (Fakes) solo para los tests, según ADR-03 §3.6. En dev y producción se usa siempre el proyecto real de Supabase — ver §7bis, donde se explica por qué esto ya no es solo el caso de `AuthProvider`.

## 7bis. Corrección importante (14 sept. 2026): "en memoria hasta el final" no funciona entre funciones serverless

El plan original (01_Backlog_MVP.md) era usar adaptadores en memoria para todo excepto `AuthProvider` hasta el final del Ciclo 1, que sustituiría todo de golpe por Postgres real. Ese plan tenía un fallo que no se detectó hasta implementar RF-03 (perfil): **cada archivo de `api/` es una función serverless independiente en Vercel, sin memoria compartida entre ellas** (ni en producción ni en `vercel dev`, que imita ese modelo a propósito). Un `Map` en memoria dentro de `ProfileRepository` solo es visible dentro de la misma función — `api/accounts/register.ts`, `api/accounts/profile.ts` y `api/accounts/session.ts` acababan cada uno con su propia copia, sin verse entre sí. Bug real encontrado en pruebas manuales: el nombre guardado desde el formulario de perfil nunca llegaba al endpoint de sesión.

Esto no es un problema de `AuthProvider` porque ese puerto nunca usó memoria en dev/producción (ver arriba) — pero sí afectaba a `ProfileRepository` (RF-03) y habría afectado a `ConsentimientoRepository` (RF-04) en cuanto tuviera un endpoint. Corregido adelantando la persistencia real de ambos al momento en que se detectó, en vez de esperar al final: `SupabaseProfileRepository` y `SupabaseConsentimientoRepository`, mismo puerto, mismo patrón que `SupabaseAuthProvider` (service role key, solo en `api/`). Esquemas en `supabase/migrations/0001_profiles.sql` y `0002_consentimientos.sql`.

**Regla general de ahora en adelante**: cualquier dato que se escriba desde una función de `api/` y se lea desde otra (caso muy común — casi cualquier dato que sobreviva a la petición que lo creó) necesita persistencia real desde el principio. "Empezar en memoria" solo es válido para un caso de uso que ni siquiera tiene todavía un endpoint que lo dispare (p. ej. `ConsentimientoRepository` antes de esta corrección, mientras RF-04 no tenía ningún `api/*.ts` propio).

## 6. Consecuencias

**Positivas:** autenticación completa sin código propio de hash/sesión; RLS como capa extra de defensa; RF-34 resuelto de forma nativa; menos superficie de código sensible a la seguridad.

**A vigilar:** el proyecto de Supabase se autopausa tras inactividad — el primer acceso tras una pausa puede tardar unos segundos en despertar. MongoDB Atlas (ya creado) queda sin uso — no hace falta borrarlo, simplemente no se usa.

---

## 7ter. Migraciones SQL: archivos versionados, aplicación manual

`supabase/migrations/*.sql` guarda el esquema como texto versionado en git (mismo espíritu que cualquier otro documento de este repo) — pero sin el CLI de Supabase instalado, aplicarlas es manual: copiar el contenido del archivo y ejecutarlo en el SQL Editor del dashboard de Supabase, una vez por proyecto (local/producción son el mismo proyecto de Supabase por ahora, ver `.env.example`). Suficiente para el ritmo actual (un desarrollador, cambios de esquema poco frecuentes); se revisita si hiciera falta un flujo más automático.

## 7. Próximo paso

Con el almacenamiento decidido, seguir con RF-01: registro (ya migrado) y login (`IniciarSesion`), ambos vía `AuthProvider` sobre Supabase Auth.

---

## Historial de cambios

- **v1.0 (10 sept. 2026)** — versión inicial: MongoDB Atlas M0 elegido por familiaridad y coste, con mitigaciones para sus carencias (sin esquema forzado, sin RLS, sin auditoría nativa).
- **v2.0 (13 sept. 2026)** — se sustituye MongoDB Atlas por **Supabase (Postgres + Auth gestionada)**, decisión tomada en el punto más barato posible (antes de construir el adaptador real de Mongo). Motivo principal: Supabase elimina la necesidad de construir autenticación a mano, además del mejor encaje relacional ya señalado en la v1.0.
- **v2.1 (14 sept. 2026)** — corrección importante (§7bis): "en memoria hasta el final" no funciona para datos que cruzan funciones serverless distintas. `ProfileRepository` y `ConsentimientoRepository` pasan a Supabase real ya, no en Sprint 5. Migraciones SQL versionadas en `supabase/migrations/`, aplicación manual (§7ter).
- **v2.2 (19 sept. 2026)** — nueva tabla `category_catalog` (ADM-02, migración 0005): catálogo global de categorías con retirada lógica (`retired_at`); `public.categories` sigue siendo por usuario y se siembra/sincroniza desde el catálogo.
- **v2.3 (20 sept. 2026)** — derecho al olvido (RF-05): los repositorios ganan borrado por usuario. Todas las tablas con datos de usuario ya tenían `on delete cascade` hacia `auth.users`, pero `DeleteAccount` borra explícitamente y deja la cuenta de acceso para el final; la cascada es solo red de seguridad. `assessments` deja de ser estrictamente "solo inserta": el borrado por usuario es la única excepción.
- **v2.4 (20 sept. 2026)** — nueva tabla `admin_audit_log` (ADM-03, migración 0006): auditoría de acciones de administración, solo inserción (trigger que impide `UPDATE`/`DELETE`), sin claves foráneas a `auth.users` para que eliminar una cuenta no borre la huella, y sin datos personales.
- **v2.5 (20 sept. 2026)** — nueva tabla `recommendations` (RF-18, migración 0007): guarda la clave de la plantilla y no el texto, con `on delete cascade` sobre `auth.users` y borrado explícito por RF-05.
