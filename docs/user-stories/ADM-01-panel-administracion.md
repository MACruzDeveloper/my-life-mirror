# Historia: Panel de administración — primer corte (usuarios registrados)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RNF-13 (roles; "administrador de uso interno, no autoasignable"), [06_Autenticacion.md](../architecture-decisions/06_Autenticacion.md) §1bis

> **Requisito propuesto, no registrado todavía.** Los requisitos actuales solo prevén el *rol* admin (RNF-13), no una pantalla de administración. Esta historia lo concreta con el identificador provisional **ADM-01**; si se acepta, se registra en [02_Requisitos_Fase1.md](../requirements-analysis/02_Requisitos_Fase1.md) (como Should, fuera del corte del MVP salvo que se decida lo contrario).

Como administrador (una sola persona, el equipo)
Quiero una página propia, accesible solo para mí, donde ver los usuarios registrados y, poco a poco, gestionar el sistema
Para operar la aplicación sin entrar a mano en el dashboard de Supabase

## Alcance del primer corte

- Ruta `/admin` y endpoint `GET /api/admin/users`: lista de usuarios (email, rol, fecha de alta, último acceso).
- Enlace "Administración" en el `Header` **solo** si la sesión es admin.
- **Sin datos personales de contenido**: el admin ve quién existe, **no** sus evaluaciones, notas ni categorías sensibles (RNF-05, minimización). Ampliarlo exigiría una decisión explícita.

## Control de acceso (rotura de control de acceso: la parte crítica)

El servidor decide, la interfaz solo se adapta:

1. **El rol se lee en el servidor**, del `app_metadata` del token que Supabase valida (`getUser`), nunca de algo que envíe el cliente. `app_metadata` no lo puede modificar el propio usuario.
2. **Doble comprobación:** el endpoint exige sesión válida (401 si no) **y** el caso de uso `ListUsers` vuelve a comprobar el rol (`ForbiddenError` → 403). Un endpoint futuro que olvide la primera no queda abierto.
3. **Denegar por defecto:** cualquier rol distinto de `admin`, o un rol ausente/corrupto, es "usuario" (ya lo garantiza `leerRolDesdeMetadata`).
4. **La interfaz no es seguridad:** ocultar el enlace y redirigir `/admin` a quien no sea admin es solo comodidad; aunque alguien llegue a la página, la API le devuelve 403 y no ve datos.
5. Sin acciones de escritura en este corte (no hay nada que un CSRF pueda alterar).
6. Aviso operativo: un cambio de rol no se refleja en una sesión ya abierta hasta que el token se renueva (ver ADR-06 §1bis).

## Criterios de aceptación

1. Given un admin con sesión válida
   When pide la lista de usuarios
   Then recibe todos los usuarios ordenados del más reciente al más antiguo, con email, rol, alta y último acceso

2. Given un usuario con rol `usuario` o `premium`
   When pide la lista (directamente a la API o desde la página)
   Then recibe 403 y ningún dato

3. Given una petición sin sesión
   When llama a `/api/admin/users`
   Then recibe 401

4. Given un usuario no admin
   When abre `/admin`
   Then se le redirige a `/inicio` y no ve el enlace de administración

5. Given un admin
   When abre `/admin`
   Then ve la tabla de usuarios y el enlace "Administración" en la cabecera

## Siguientes cortes (por decidir, no implementados)

- **Catálogo de categorías gestionable (añadir/quitar)** → ver [ADM-02](ADM-02-catalogo-categorias.md), ya implementada. Contexto: cada usuario tiene su propia copia sembrada desde una lista fija en código ([RF-06-RF-07-categorias.md](RF-06-RF-07-categorias.md)). Que el admin pueda añadir o quitar categorías exige un **catálogo global en base de datos** (tabla propia) y que las de cada usuario apunten a él. Decisiones abiertas: qué pasa con las categorías ya activadas cuando el admin retira una (propuesta: se *retira* del catálogo —no se borra— y desaparece para nuevas activaciones, conservando las evaluaciones históricas), y cómo llegan las categorías nuevas a usuarios existentes. Es un cambio de modelo (ADR + migración), no un formulario.
- Cambiar el rol de un usuario desde la página (hoy es SQL manual): mutación sensible, con registro de auditoría.
- Métricas de uso agregadas (sin datos personales).

## Historial de cambios

- **v1.0 (19 sept. 2026)** — versión inicial: primer corte (lista de usuarios) y diseño del control de acceso.
- **v1.1 (19 sept. 2026)** — la página `/admin` gana la pestaña Categorías (ADM-02); el control de acceso se reutiliza (`requireAdmin` en `shared/domain/Actor.ts`).
