# Historia: Contraseñas fuertes (SEC-01)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-01 (registro e inicio de sesión), RF-38 (recuperar la contraseña), ADM-03 (alta de usuarios con contraseña temporal), [Plan de seguridad](../security/01_Plan_Seguridad.md) (hallazgos H3 y H8, paso 4), OWASP A07:2025, decisión del autor del 11 oct.

Como persona que crea una cuenta
Quiero saber qué contraseña se me pide y que no me deje poner una fácil de adivinar
Para que nadie entre en mis datos probando contraseñas típicas

## Alcance

- **La regla** (una sola, en el dominio; la usan el servidor y los formularios):
  1. entre 12 y 72 caracteres;
  2. al menos una minúscula, una mayúscula, un número y un símbolo;
  3. sin secuencias ni repeticiones: cuatro seguidos del alfabeto, de los números o del teclado (`1234`, `abcd`, `qwer`), hacia delante o hacia atrás, ni el mismo carácter tres veces (`aaa`);
  4. que no sea una contraseña común: se quitan números y símbolos, se deshacen las sustituciones típicas (`4`→`a`, `0`→`o`, `$`→`s`…) y lo que queda no puede ser una palabra de la lista curada (`password`, `contraseña`, `qwerty`, el nombre de la app…);
  5. que no contenga el nombre ni la parte del email anterior a la arroba (trozos de 4 letras o más).
- **Por qué las cinco y no solo los tipos de caracteres:** una expresión regular puede exigir tipos de caracteres, pero no distinguir `Test1234!` de una contraseña buena. Lo que la frena aquí es la suma: es corta (regla 1), lleva una secuencia (3) y su palabra base es común (4).
- **Dónde se aplica:** al registrarse (RF-01) y al poner una contraseña nueva tras recuperarla (RF-38). La contraseña temporal que genera la administración (ADM-03) cumple la misma regla.
- **Cómo se explica:** en esos dos formularios, la lista de requisitos se ve desde el principio y cada uno se marca al cumplirse. Lo que falta se dice con su motivo concreto. No se puede enviar hasta cumplirla; el servidor la comprueba de nuevo.
- **Inicio de sesión:** ninguna comprobación ni pista. Una contraseña que no cumple la regla recibe el mismo "email o contraseña incorrectos" que cualquier otra.
- **Cuentas que ya existen:** siguen entrando con su contraseña. La regla solo se aplica a contraseñas nuevas.
- **Email ya registrado:** el registro deja de decir "ya existe una cuenta con ese email". Responde con un mensaje neutro: no se ha podido crear la cuenta con ese email, y ofrece iniciar sesión o recuperar la contraseña. Ver la nota de límites.
- **Fuera de alcance:** comprobar la contraseña contra bases de datos de filtraciones (en Supabase es de pago), obligar a cambiar las contraseñas antiguas, segundo factor.

### Nota de límites: el mensaje del email ya registrado

El mensaje neutro quita la confirmación explícita, pero **no impide del todo** averiguar si un email tiene cuenta: con un email bien escrito y una contraseña válida, que el registro falle ya lo indica. Cerrarlo de verdad exige verificar el email (responder siempre "te hemos enviado un correo") y es una decisión aparte (plan de seguridad, paso 9). Lo que sí limita el abuso es el tope de intentos (SEC-02).

## Criterios de aceptación

1. Given el formulario de registro
   When se abre
   Then se ven los requisitos de la contraseña antes de escribir nada

2. Given una contraseña que cumple la regla
   When se envía el registro
   Then la cuenta se crea

3. Given `Test1234!`, `Password1234!`, `Qwerty-12345` o `P4ssw0rd!2026`
   When se intenta registrar con cualquiera de ellas
   Then no se crea la cuenta y se dice qué requisito falla

4. Given una persona que se llama Marina, con email `marina.lopez@ejemplo.com`
   When elige `Marina-Lopez-2026!`
   Then se rechaza porque contiene su nombre

5. Given una petición directa al servidor con una contraseña débil, sin pasar por el formulario
   When llega al registro o al cambio de contraseña
   Then se rechaza con los requisitos que fallan

6. Given una cuenta antigua con una contraseña de 8 caracteres
   When inicia sesión
   Then entra como siempre

7. Given una contraseña incorrecta o que no cumple la regla
   When se intenta iniciar sesión
   Then el mensaje es el mismo en los dos casos, sin mencionar requisitos

8. Given un email que ya tiene cuenta
   When alguien intenta registrarse con él
   Then el mensaje no afirma que la cuenta existe

9. Given un administrador que crea un usuario
   When recibe la contraseña temporal
   Then cumple la regla

## Historial de cambios

- **v1.0 (11 oct. 2026)** — versión inicial. Decisiones del autor: combinar longitud, tipos de caracteres y comprobaciones contra contraseñas previsibles; mensajes solo en el registro; mensaje neutro para el email ya registrado.
