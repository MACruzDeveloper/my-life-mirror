# Historia: Gestión de usuarios por el administrador

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Estado:** Implementada (decisiones confirmadas el 20 sept. 2026).
**Referencias:** [ADM-01](ADM-01-panel-administracion.md) (lista de usuarios y control de acceso), [ADM-02](ADM-02-catalogo-categorias.md), [RF-05](RF-05-exportar-eliminar-datos.md) (borrado de cuenta), RNF-13 (roles), RNF-05 (privacidad)

> **Requisito propuesto, no registrado todavía** (igual que ADM-01/02): los requisitos actuales solo prevén el rol admin. Si se acepta, se registra en [02_Requisitos_Fase1.md](../requirements-analysis/02_Requisitos_Fase1.md).

Como administrador (una sola persona, el equipo)
Quiero poder crear, modificar, suspender y eliminar cuentas de otros usuarios
Para atender casos reales: alguien que da problemas, alguien que no consigue registrarse, un correo mal escrito, un rol que hay que conceder

## Regla ya implementada (RF-05)

**Siempre debe existir al menos un administrador.** El único administrador no puede eliminar su cuenta (la app le explica que debe crear otro antes). Esta historia extiende la regla a todo lo demás: no se puede eliminar **ni degradar** al último administrador, por ninguna vía.

## Propuesta

**1. Modificar un usuario** (`POST /api/admin/...`, acciones dentro de una única función `api/admin/[action].ts`)
- Cambiar el **rol** (`usuario` / `premium` / `admin`). Sustituye al SQL manual de ADR-06 apartado 1.1. Con la regla del último administrador.
- Corregir el **email** (caso "escribió mal su correo") y el **nombre**.
- Enviar un **enlace de recuperación de contraseña** (caso "no puede entrar"), reutilizando `resetPasswordForEmail`. El admin **nunca ve ni fija** contraseñas ajenas.

**2. Crear un usuario** (caso "no consigue registrarse")
- El admin indica email y nombre; la cuenta se crea con el rol `usuario` y una **contraseña temporal aleatoria** (12+ caracteres, generada con `crypto`) que se muestra **una sola vez** en un cuadro con aviso y botón de copiar. No se guarda ni se anota en la auditoría. Se eligió esta vía (y no el enlace por correo) porque el correo de Supabase Free tiene límites de envío; el riesgo asumido es que la contraseña circula del admin a la persona por un canal fuera de la app — por eso se le recomienda cambiarla con "He olvidado mi contraseña".

**3. Suspender / reactivar** (caso "da problemas") — *propuesta de matiz*
- Antes de borrar, una **suspensión reversible** (Supabase permite bloquear el acceso a una cuenta): el usuario no puede iniciar sesión ni usar la sesión abierta, pero sus datos se conservan. Reactivar deshace todo. Es la respuesta proporcionada a un problema de conducta; eliminar queda para casos graves o a petición del usuario.

**4. Eliminar a otro usuario** (moderación)
- Reutiliza el mismo borrado en profundidad que RF-05 (evaluaciones → categorías → consentimientos → perfil → cuenta de acceso, repetible), pero **sin** la contraseña del afectado: la confirma el admin con **su propia contraseña**.
- No se puede eliminar al último administrador; para eliminar a otro admin primero hay que degradarlo (así nunca se borra un admin "por accidente").
- El admin no puede usar esta vía sobre sí mismo (su caso es RF-05, con la regla del último admin).

**5. Registro de auditoría**
- Cada acción de administración (quién, cuándo, sobre qué cuenta, qué acción) queda en una tabla `admin_audit_log`. Es lo que permite defender una decisión ante una queja y detectar un uso indebido. No guarda contenido de los usuarios.
- Al eliminar una cuenta, el registro conserva solo el id y la acción, no el email (para respetar el derecho al olvido).

## Control de acceso (igual que ADM-01, más estricto)

1. Rol leído en el servidor de la sesión verificada; `requireAdmin` otra vez en cada caso de uso (defensa en profundidad).
2. Todas son operaciones `POST`. Las destructivas (eliminar, degradar, suspender) exigen además la **contraseña del admin** en el cuerpo.
3. Sin datos de contenido: el admin gestiona cuentas, no ve evaluaciones, notas ni categorías sensibles (RNF-05).
4. Regla del último administrador comprobada en el caso de uso, no en la interfaz.
5. Avisar al usuario afectado (suspensión, eliminación) queda para RF-23 (notificaciones) — mientras, sin correo automático.

## Criterios de aceptación (esbozo)

1. Given un admin, When cambia el rol de un usuario, Then el cambio queda guardado y auditado; y si el usuario es el último admin, se rechaza.
2. Given un admin, When crea un usuario con un email nuevo, Then la cuenta existe con rol `usuario` y se envía el enlace para elegir contraseña; si el email ya existe, se rechaza.
3. Given un admin, When suspende a un usuario, Then ese usuario no puede iniciar sesión ni seguir usando su sesión abierta; al reactivarlo todo vuelve como estaba.
4. Given un admin con su contraseña correcta, When elimina a otro usuario, Then se borran todos sus datos y su cuenta y queda un registro de auditoría sin su email; con contraseña incorrecta no pasa nada.
5. Given cualquier acción de administración, When la pide un no admin, Then recibe 403 y no cambia nada.
6. Given el último administrador, When alguien intenta eliminarlo o degradarlo (por cualquier vía), Then se rechaza con un mensaje que explica que debe crearse otro antes.

## Decisiones tomadas

1. **Suspender y eliminar**, ambas (suspender es reversible y la respuesta proporcionada a un problema de conducta).
2. **Crear con contraseña temporal** (ver arriba el riesgo asumido).
3. **El admin puede cambiar el email** de otra persona, con su contraseña y con anotación en la auditoría (sin guardar los emails).
4. **Auditoría en tabla de base de datos** (`admin_audit_log`, migración 0006), no solo en los logs de Vercel. Motivo (OWASP Top 10 A09 "Fallos de registro y monitorización" y OWASP Logging Cheat Sheet): las acciones de administración y los cambios de privilegios son eventos de seguridad que deben registrarse con quién/cuándo/qué/sobre qué; los logs de Vercel en el plan gratuito se conservan muy poco tiempo, no se pueden consultar con comodidad ni están protegidos contra modificación. La tabla es de solo inserción (un trigger impide `UPDATE`/`DELETE`), no guarda datos personales (solo ids, acción y un detalle corto) y no borra sus huellas cuando se elimina una cuenta (sin clave foránea a `auth.users`). Además, los intentos sin permiso (403) y los fallos de la contraseña de confirmación (`reauth.failed`) también quedan anotados (log operativo y auditoría).
5. **Orden de construcción** (roles y regla del último admin → eliminar/suspender → crear → editar): construido de una vez, en ese orden.

## Cómo quedó

- `AdminUserActions` (`cuentas/application`): `changeRole`, `suspendUser`, `reactivateUser`, `deleteUser`, `updateEmail`, `updateName`, `createUser`, `sendRecoveryLink`, `listAudit`. `requireAdmin` en cada una; contraseña del admin (`iniciarSesion` con su email de sesión) en rol, email, suspender y eliminar; el intento fallido se anota.
- **Siempre un administrador:** nadie cambia su propio rol; no se suspende ni se elimina a un administrador (se le degrada antes) ni a uno mismo por esta vía (eso es RF-05, con su propia regla del último admin).
- El borrado reutiliza `EraseUser`, el mismo de RF-05 (datos primero, cuenta la última, repetible).
- Suspender usa el bloqueo de Supabase (`ban_duration`); además `verificarSesion` rechaza una sesión ya abierta de una cuenta suspendida.
- Endpoints en una única función `api/admin/[action].ts` (`users`, `audit`, `user-role`, `user-suspend`, `user-reactivate`, `user-delete`, `user-email`, `user-name`, `user-create`, `user-recovery`); solo `POST` las de escritura; respuestas con `Cache-Control: no-store`.
- Interfaz: `/admin` con pestañas Usuarios (menú de acciones por fila, crear usuario, cuadros de confirmación), Categorías y Auditoría.
- **Límite conocido:** la anotación de auditoría se escribe *después* de la acción; si fallara la escritura de la anotación, la acción ya estaría hecha y el error se vería (500). Se prefirió eso a ocultarlo.

## Historial de cambios

- **v1.0 (20 sept. 2026)** — diseño propuesto a partir de la petición de que el admin pueda crear, modificar y eliminar usuarios, con la regla de que siempre exista un administrador.
- **v1.1 (20 sept. 2026)** — implementada; decisiones confirmadas (suspender y eliminar, contraseña temporal, editar email, auditoría en tabla según OWASP A09).
