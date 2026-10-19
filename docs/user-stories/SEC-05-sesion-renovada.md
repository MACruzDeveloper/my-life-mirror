# Historia: La sesión se renueva sola y avisa si caduca (SEC-05)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** [ADR-06](../architecture-decisions/06_Autenticacion.md) (autenticación), [SEC-03](SEC-03-cabeceras-y-peticiones.md) (cookies y plantillas de controladores), ADM-03 (cuentas suspendidas), RNF-10 (i18n), fallo encontrado por el autor el 16 oct.

Como persona que usa la app un buen rato
Quiero que mi sesión no se corte sin avisar
Para no perder lo que estaba guardando

## Por qué

La cookie de sesión guardaba el token de Supabase, que dura una hora, y nada lo renovaba. Pasada la hora, toda acción fallaba con un "No autenticado" del servidor, sin traducir. La página parecía seguir con la sesión abierta porque los datos salen de la caché. El autor lo encontró al guardar su profesión en el perfil.

## Alcance

- **Dos cookies, las dos `HttpOnly`, `Secure` y `SameSite=Lax`:**
  - `sesion`: el token de acceso de Supabase, que dura una hora, como antes.
  - `sesion_renovar`: el token de renovación, solo para `/api`, con **dos días** de duración (decisión del autor).
- **Renovación sin que se note:** si el token de acceso ya no vale, el servidor usa el de renovación, comprueba la cuenta y responde con tokens nuevos en las dos cookies. Cada renovación vuelve a contar los dos días, así que la contraseña solo se pide tras **dos días sin usar la app**.
- **Una cuenta suspendida (ADM-03) no se renueva:** su sesión termina igual que antes.
- **Cerrar sesión y borrar la cuenta** borran las dos cookies.
- **Si aun así la sesión caduca** (más de dos días sin entrar, cuenta suspendida, renovación rechazada):
  - La app lo dice en una ventana, en el idioma de la interfaz: "Tu sesión ha caducado. Vuelve a entrar para seguir."
  - El botón lleva al inicio de sesión.
  - Se vigila en un solo sitio, para cualquier llamada a la API desde una pantalla protegida. Quedan fuera el inicio de sesión, el registro y la recuperación de contraseña, que responden 401 por otros motivos.
- **Los tokens nunca llegan al código del navegador:** viven solo en cookies `HttpOnly`, como hasta ahora.

## Criterios de aceptación

1. Given una sesión con el token de acceso caducado y el de renovación válido
   When se hace cualquier acción
   Then se completa, y la respuesta trae las dos cookies renovadas

2. Given una sesión sin token de acceso ni de renovación válidos
   When se hace una acción
   Then el servidor responde 401 y no ejecuta nada

3. Given una cuenta suspendida con el token de renovación válido
   When se intenta renovar
   Then no se renueva y responde 401

4. Given una pantalla protegida
   When una llamada a la API responde 401
   Then aparece "Tu sesión ha caducado" con un botón para volver a entrar

5. Given la pantalla de inicio de sesión
   When la contraseña es incorrecta (401)
   Then no aparece el aviso de sesión caducada, sino el error de siempre

6. Given una sesión abierta
   When se cierra sesión
   Then se borran las dos cookies
