# Historia: Registrarse con email y contraseña

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-01, RD-01, [06_Autenticacion.md](../architecture-decisions/06_Autenticacion.md) y [07_UI.md](../architecture-decisions/07_UI.md)

Como usuario nuevo
Quiero crear una cuenta con mi email y una contraseña
Para poder empezar a usar la app

## Criterios de aceptación

1. Given un email no registrado y una contraseña de al menos 8 caracteres
   When el usuario envía el formulario de registro
   Then se crea la cuenta y la contraseña se guarda como hash, nunca en texto plano

2. Given un email que ya tiene una cuenta
   When el usuario intenta registrarse con ese email
   Then el sistema rechaza el registro sin revelar más detalle que "email ya registrado"

3. Given un email con formato inválido, o una contraseña de menos de 8 caracteres
   When el usuario envía el formulario
   Then el sistema rechaza el registro con un mensaje específico del campo inválido

## Nota "spec viva"

El login (con sesión JWT) es una historia aparte. **Excepción de flujo:** al registrarse con éxito el servidor deja también la sesión iniciada (misma cookie httpOnly que el login) y el usuario va directo a `/inicio` (bienvenida de primera vez, RF-39); pedirle otra vez el email y la contraseña que acaba de escribir era fricción sin ganancia de seguridad. Si esa segunda parte fallara, la cuenta ya existe y se le ofrece iniciar sesión a mano.

## Historial de cambios

- **v1.0 (13 sept. 2026)** — versión inicial.
- **v1.1 (19 sept. 2026)** — el registro deja la sesión iniciada y lleva a `/inicio`.
