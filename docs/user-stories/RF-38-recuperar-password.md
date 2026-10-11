# Historia: Recuperar contraseña olvidada

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-38, [06_Autenticacion.md](../architecture-decisions/06_Autenticacion.md)

Como usuario que olvidó su contraseña
Quiero pedir un enlace de restablecimiento a mi email
Para volver a acceder a mi cuenta sin contactar con soporte

## Criterios de aceptación

1. Given un email de una cuenta existente
   When el usuario pide restablecer su contraseña
   Then se le confirma que, si el email existe, recibirá un enlace — sin confirmar ni negar si la cuenta existe (evita enumerar cuentas)

2. Given un email que no corresponde a ninguna cuenta
   When el usuario pide restablecer su contraseña
   Then la respuesta es idéntica a la del caso 1 (mismo motivo: no revelar qué emails están registrados)

3. Given un enlace de restablecimiento válido y no usado
   When el usuario establece una contraseña nueva que cumple la política (SEC-01)
   Then la contraseña se actualiza y puede iniciar sesión con ella

## Nota de diseño (por qué no se usa el SDK de Supabase en el navegador)

El flujo estándar de Supabase espera que el cliente JS del navegador complete el reset. Aquí no: mantenemos la disciplina ya establecida (AGENTS.md) de que el SDK de Supabase solo se usa en `api/`, nunca en el cliente. El enlace del email lleva un token de recuperación en la URL; el frontend lo lee y lo envía a `/api/restablecer-password`, que lo valida contra Supabase (`auth.getUser(token)`) y aplica el cambio con `auth.admin.updateUserById` — todo en el servidor.

## Historial de cambios

- **v1.0 (14 sept. 2026)** — versión inicial.
- **v1.1 (11 oct. 2026)** — la contraseña ya no es "al menos 8 caracteres": la política está en [SEC-01](SEC-01-contrasenas-fuertes.md); el inicio de sesión no da pistas y los intentos están contados ([SEC-02](SEC-02-limite-de-intentos.md)).
