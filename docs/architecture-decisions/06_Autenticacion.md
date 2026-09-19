# ADR-06: Mecanismo de Autenticación

**Estado:** Aceptado
**Fecha:** 13 de septiembre de 2026
**Relacionado con:** [01_Stack_Tecnologico.md](01_Stack_Tecnologico.md), [03_Arquitectura_Software.md](03_Arquitectura_Software.md), [04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md), RF-01, RF-02, RF-38, RF-39, RNF-09, RNF-13

---

## 1. Autenticación: Supabase Auth

Se usa la autenticación gestionada de Supabase — contraseñas y sesión dejan de ser código propio.

- **Puerto** `AuthProvider` (dominio), con un adaptador `SupabaseAuthProvider` (infraestructura) que llama al SDK de Supabase con la *service role key* (nunca expuesta al navegador). La vista y la API nunca importan el SDK de Supabase directamente — solo el caso de uso, a través del puerto (misma disciplina que el resto del proyecto, ADR-03 §3.2-3.4).
- **Registro**: `auth.admin.createUser`, con `email_confirm: true` — se omite la confirmación por email para el Ciclo 1 (simplifica el flujo sin necesitar configurar URLs de redirección todavía). Esto significa que, de momento, no se verifica que el usuario sea dueño real del email — limitación conocida y aceptada para el MVP, no para producción real.
- **Login**: `auth.signInWithPassword`, que devuelve un `access_token` (JWT) ya emitido por Supabase — no hace falta firmar nada nosotros.
- **Sesión**: el `access_token` de Supabase se guarda en una cookie `httpOnly` + `secure`, puesta por nuestro propio endpoint de login (no por el cliente de Supabase en el navegador) — mantiene la sesión fuera del alcance de JavaScript en el cliente.
- **Entorno de desarrollo**: se usa el proyecto real de Supabase también en `dev` (no hay un sustituto en memoria razonable para autenticación completa); los tests de caso de uso sí usan un `InMemoryAuthProvider` (Fake), igual que el resto del proyecto (ADR-03 §3.6).
- **RF-02** (login con Google/Apple): queda mucho más barato con Supabase Auth, que ya trae proveedores OAuth — no se implementa todavía (Should, no Ciclo 1), pero la vía de menor coste era justamente parte de la razón para cambiar de proveedor de datos ([04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md) §3).
- **Sesión desde el navegador (RF-39)**: la cookie es httpOnly a propósito — el frontend no puede leerla. `/api/accounts/session` (handler `session.ts`) la comprueba en el servidor (`auth.getUser(token)`) y responde `{autenticado, email, name}`; `/api/accounts/logout` la borra (`Max-Age=0`).
- **Recuperación de contraseña (RF-38)**: `auth.resetPasswordForEmail` con `redirectTo` apuntando a `<APP_URL>/restablecer-password` (env var nueva, ver `.env.example` — debe coincidir con una URL permitida en Supabase: Authentication > URL Configuration > Redirect URLs). El enlace del email lleva el token en el *hash* de la URL, no en query params; el frontend lo extrae (`extraerTokenDeHash`) y lo envía a `/api/accounts/reset-password`, que lo valida con `auth.getUser(token)` y aplica el cambio con `auth.admin.updateUserById` — el SDK de Supabase sigue sin tocarse desde el navegador. La respuesta de "solicitar recuperación" es idéntica exista o no el email, para no permitir enumerar cuentas.

## 1bis. Roles de usuario (RNF-13)

Se añade `rol: "usuario" | "premium" | "admin"` a `UsuarioAutenticado` (puerto `AuthProvider`), con `"usuario"` como valor por defecto — nadie se autorregistra como premium o admin.

- **Dónde vive**: `app_metadata` de Supabase Auth, no `user_metadata`. La diferencia importa: `user_metadata` lo puede escribir el propio usuario autenticado desde el cliente; `app_metadata` solo se escribe con la *service role key* (servidor). Guardar el rol ahí es defensa en profundidad — aunque hoy ningún endpoint propio permita a un usuario cambiar su rol, si algún día se filtrara ese error, `user_metadata` sería explotable y `app_metadata` no.
- **Lectura defensiva**: `leerRolDesdeMetadata` (dominio, con test propio) valida el valor recibido contra la lista de roles conocidos y cae a `"usuario"` ante cualquier dato ausente, corrupto o no reconocido — nunca se asume un rol con más privilegios de los que constan explícitamente.
- **Cómo se concede admin/premium hoy**: el dashboard de Supabase no deja editar `app_metadata` desde la lista de usuarios (esa vista solo tiene columnas fijas: UID, email, proveedor...) ni siempre desde el propio panel del usuario. La vía fiable es SQL directo en el **SQL Editor** de Supabase, ya que `auth.users` es una tabla Postgres real:

  ```sql
  -- Conceder (usa || para fusionar, no pisar otras claves que ya tenga app_metadata)
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('rol', 'admin')
  where email = 'tu-email@ejemplo.com';

  -- Verificar
  select id, email, raw_app_meta_data ->> 'rol' as rol
  from auth.users
  order by created_at desc;
  ```

  No existe todavía un flujo propio de gestión de roles (endpoint/UI) — es la vía razonable mientras el admin sea una sola persona (el propio equipo) y premium no tenga ventajas definidas (RN-11/RD-10). Importante: el cambio no se refleja en una sesión ya abierta hasta que el usuario vuelva a iniciar sesión (el `access_token` ya emitido lleva los metadatos de cuando se creó).

## 2. Bloqueo resuelto (13-14 sept. 2026)

El proyecto de Supabase devolvía `PGRST125` ("Invalid path specified in request URL") en **todas** las rutas del gateway de API, confirmado con `curl` directo sin pasar por el SDK — la base de datos en sí funcionaba bien. Descartado por evidencia directa: elección de clave, código/SDK propios, reinicio del proyecto. **Causa real: `SUPABASE_URL` estaba mal** (a pesar de tener el formato correcto a simple vista). Corregido; registro y login verificados funcionando de extremo a extremo.

## 3. Próximo paso

Con registro, login, sesión, logout y recuperación de contraseña completos, el resto de Ciclo 1 continúa según [01_Backlog_MVP.md](../project-management/01_Backlog_MVP.md) (siguiente: RF-04, consentimiento). Pendiente de tu parte: añadir `<APP_URL>/restablecer-password` a las Redirect URLs permitidas en el dashboard de Supabase, y `APP_URL` tanto en `.env` como en las variables de entorno de Vercel.

---

## Historial de cambios

- **v1.0 (13 sept. 2026)** — versión inicial: bcrypt + JWT firmado a mano en cookie httpOnly (MongoDB no incluía autenticación).
- **v2.0 (13 sept. 2026)** — se sustituye por Supabase Auth (`auth.admin.createUser` / `auth.signInWithPassword`), tras el cambio de base de datos en [04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md) v2.0. La sesión sigue viajando en cookie httpOnly, pero el token ya lo emite Supabase, no código propio.
- **v2.1 (13 sept. 2026)** — bloqueo abierto documentado en §2: gateway del proyecto de Supabase devuelve `PGRST125` en todas las rutas; sin resolver, no es un problema de nuestro código.
- **v2.2 (14 sept. 2026)** — bloqueo resuelto: `SUPABASE_URL` estaba mal configurada. Registro y login verificados funcionando de extremo a extremo.
- **v2.3 (14 sept. 2026)** — se añaden verificación de sesión (`api/sesion.ts`, `api/logout.ts`, RF-39) y recuperación de contraseña completa (RF-38): `auth.resetPasswordForEmail` + `auth.admin.updateUserById`, token vía hash de URL, respuesta uniforme sin revelar existencia de cuentas. Nueva env var `APP_URL`.
- **v2.4 (14 sept. 2026)** — roles de usuario (RNF-13, §1bis): `rol` en `app_metadata`, no autoasignable, lectura defensiva con `"usuario"` como valor por defecto.
- **v2.5 (14 sept. 2026)** — §1bis: procedimiento concreto para conceder un rol (SQL directo sobre `auth.users`, no el dashboard) y aviso de que el cambio no se refleja en una sesión ya abierta hasta volver a iniciar sesión.
- **v2.6 (19 sept. 2026)** — el rol se expone en `/api/accounts/session` para adaptar la interfaz, y aparece el primer uso real de `admin` (`/api/admin/users`, [ADM-01](../user-stories/ADM-01-panel-administracion.md)) con doble comprobación en servidor.
- **v2.7 (19 sept. 2026)** — los handlers de `accounts` viven ahora en `src/shared/infrastructure/http/handlers/accounts/` y se sirven desde `api/accounts/[action].ts` (límite de funciones de Vercel Hobby, ver ADR-03 v2.3); las URLs no cambian.
