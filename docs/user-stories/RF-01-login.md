# Historia: Iniciar sesión con email y contraseña

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-01, [06_Autenticacion.md](../architecture-decisions/06_Autenticacion.md)

Como usuario con cuenta ya creada
Quiero iniciar sesión con mi email y contraseña
Para acceder a mi cuenta

## Criterios de aceptación

1. Given una cuenta ya registrada
   When el usuario envía email y contraseña correctos
   Then se inicia sesión y el token queda en una cookie httpOnly, nunca en el cuerpo de la respuesta

2. Given credenciales incorrectas (email inexistente o contraseña equivocada)
   When el usuario envía el formulario
   Then el sistema rechaza el intento con un mensaje genérico ("email o contraseña incorrectos"), sin indicar cuál de los dos falló

## Historial de cambios

- **v1.0 (13 sept. 2026)** — versión inicial, documentada junto con la implementación (debería haberse escrito antes, per SDD Nivel 2).
