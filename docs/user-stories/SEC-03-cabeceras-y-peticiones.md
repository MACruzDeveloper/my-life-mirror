# Historia: Cabeceras de seguridad y peticiones más estrictas (SEC-03)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RNF de seguridad, [Plan de seguridad](../security/01_Plan_Seguridad.md) (hallazgos H4, H6, H7 y H11; pasos 6 y 7), OWASP A02:2025 y A05:2025, ADR-03 apartado 3.4 (controladores)

Como persona que usa la app
Quiero que el navegador y el servidor rechacen lo que no debería llegar
Para que un fallo en una capa no baste para comprometer mis datos (defensa en profundidad)

## Alcance

- **Cabeceras en todas las respuestas** (`vercel.json`):
  - **Política de contenido (CSP):** el navegador solo carga código, estilos, imágenes y datos de la propia app. Si algún día se colara un script ajeno, no se ejecutaría. Los estilos en línea se permiten porque la librería de interfaz los genera al vuelo.
  - **`X-Frame-Options: DENY`** y `frame-ancestors 'none'`: la app no se puede incrustar en otra web (evita que alguien la tape con botones falsos).
  - **`X-Content-Type-Options: nosniff`:** el navegador no "adivina" el tipo de un archivo.
  - **`Referrer-Policy`:** al salir a un enlace externo solo se envía el dominio, no la página.
  - **`Permissions-Policy`:** cámara, micrófono, ubicación y pagos, desactivados: la app no los usa.
  - **HSTS** ya lo ponía Vercel.
- **Respuestas de la API sin caché** (`Cache-Control: no-store`): son datos de una persona; ningún intermediario debe guardarlos.
- **Origen de la petición:** toda acción que cambia datos comprueba que viene de la propia web; desde otra, 403. La cookie `SameSite=Lax` ya lo impedía: es una segunda capa contra el CSRF.
- **Tamaño y longitudes:** un cuerpo de más de 32 000 caracteres se rechaza (413) antes de procesarlo; email, contraseña, nombre e identificadores tienen longitud máxima.
- **Una plantilla para los controladores públicos** (`publicHandler`): inicio de sesión, registro, recuperar y cambiar la contraseña repetían el mismo código; ahora comparten método, origen, tamaño, validación, tope de intentos (SEC-02) y traducción de errores, como ya hacían los controladores con sesión.
- **El cliente de Supabase del servidor**, en un solo sitio y sin sesión guardada. El inicio de sesión usa un cliente que se descarta: el compartido nunca se queda actuando como la última persona que entró.
- **Comprobación continua:** `npm run smoke:prod` falla si las cabeceras desaparecen de producción.
- **Fuera de alcance:** quitar `access-control-allow-origin: *` de los archivos estáticos (lo pone Vercel; son archivos públicos), una CSP con *nonces* (pediría renderizar en el servidor).

## Criterios de aceptación

1. Given cualquier página de la app en producción
   When se piden sus cabeceras
   Then incluyen la política de contenido, `nosniff`, la protección contra marcos, `Referrer-Policy` y `Permissions-Policy`

2. Given el build de producción servido con esas cabeceras
   When se recorre la app (registro, entrevista, gráficos, ideas, diario, exportar, eliminar la cuenta)
   Then todo funciona y el navegador no bloquea nada

3. Given una acción que cambia datos, pedida desde otra web con la sesión de la víctima
   When llega al servidor
   Then responde 403 y no ejecuta nada

4. Given una petición sin cabecera de origen (una herramienta, no un navegador)
   When llega al servidor
   Then se atiende con normalidad

5. Given un cuerpo desmesurado
   When llega a cualquier controlador
   Then responde 413 sin validarlo ni ejecutar nada

6. Given cualquier respuesta de la API, también un error
   When se leen sus cabeceras
   Then lleva `Cache-Control: no-store`

## Historial de cambios

- **v1.0 (11 oct. 2026)** — versión inicial. Criterio 2 verificado con los E2E sobre el build de producción servido con las cabeceras de `vercel.json`.
