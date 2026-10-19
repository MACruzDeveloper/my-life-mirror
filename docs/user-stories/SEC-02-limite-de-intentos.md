# Historia: Límite de intentos en el acceso (SEC-02)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-01 (registro e inicio de sesión), RF-38 (recuperar la contraseña), [Plan de seguridad](../security/01_Plan_Seguridad.md) (hallazgo H2, paso 5), OWASP A07:2025, MITRE ATT&CK T1110 (fuerza bruta), ADR-04 apartado 5.1 (por qué en la base de datos)

Como persona con una cuenta
Quiero que nadie pueda probar contraseñas contra ella sin freno
Para que una contraseña buena no acabe cayendo por insistencia

## Alcance

- **Por qué hace falta un tope propio:** la app habla con Supabase desde el servidor. El límite de Supabase va por IP, y la IP que ve es la de Vercel, no la de quien ataca: no distingue a un atacante del resto de usuarios.
- **Dónde:** las cuatro acciones que cualquiera puede llamar sin sesión.

  | Acción | Por IP | Por cuenta (email) |
  |---|---|---|
  | Iniciar sesión | 30 cada 15 min | 10 cada 15 min |
  | Registrarse | 5 cada hora | — |
  | Pedir el correo de recuperación | 10 cada hora | 3 cada hora |
  | Cambiar la contraseña con el enlace | 10 cada hora | — |

- **Por IP y por cuenta a la vez:** el tope por cuenta frena a quien cambia de IP para insistir contra un mismo email; el de IP, a quien prueba muchos emails desde un sitio.
- **Al superarlo:** respuesta 429 con cuánto esperar, y un mensaje claro ("Demasiados intentos. Espera unos minutos…"). El mensaje es el mismo exista o no la cuenta. Queda anotado en el registro del servidor.
- **Dónde se cuenta:** en la base de datos (migración 0021), porque cada función del servidor está aislada y no comparte memoria. Comprobar y sumar es una sola operación: dos peticiones a la vez no pasan las dos.
- **Qué se guarda:** un resumen (SHA-256) de "acción + IP" o "acción + email", el principio de la ventana y un contador. Ni el email ni la IP. Las ventanas de más de un día se borran solas.
- **Si el contador falla** (base caída, migración sin aplicar): se deja pasar y se anota. Es preferible un rato sin freno a que nadie pueda entrar.
- **En local** (Supabase en Docker: E2E y `dev:local`) no hay tope: una misma máquina registra decenas de cuentas en segundos.
- **Coste asumido:** alguien puede gastar a propósito los 10 intentos de otra persona y dejarla 15 minutos sin poder entrar. Se acepta: es un rato y no pierde nada.
- **Fuera de alcance:** CAPTCHA, bloqueo permanente de cuentas, avisar por correo de los intentos fallidos, tope en las acciones con sesión (la IA ya tiene el suyo, RF-40b).

## Criterios de aceptación

1. Given 10 intentos de inicio de sesión contra un mismo email en 15 minutos, desde las IP que sean
   When llega el siguiente
   Then se rechaza con 429 sin comprobar la contraseña, aunque fuera la correcta

2. Given 30 intentos de inicio de sesión desde una misma IP en 15 minutos, con los emails que sean
   When llega el siguiente
   Then se rechaza con 429

3. Given un email escrito con otras mayúsculas o con espacios
   When se cuenta el intento
   Then cuenta para la misma cuenta

4. Given el tope alcanzado
   When empieza la ventana siguiente
   Then se puede volver a intentar

5. Given el contador de la base de datos sin responder
   When alguien inicia sesión
   Then entra con normalidad y el fallo queda en el registro

6. Given la tabla de contadores
   When se lee
   Then no contiene ningún email ni ninguna IP
