# Historia: Exportar y eliminar mis datos

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-05 (Must, derecho al olvido), RNF-12 (portabilidad, Should), RNF-05 (RGPD), RF-12 (registro inmutable)

Como usuario
Quiero descargar todos mis datos y, si lo decido, eliminar mi cuenta y todo lo que hay en ella
Para tener el control sobre la información personal que he dejado en la aplicación

## Alcance

- **Exportar** (RNF-12): un archivo JSON, legible y estructurado, con **todo** lo del usuario: cuenta (id y email), perfil, categorías (con su estado), consentimientos otorgados todas las evaluaciones (con el nombre de la categoría, la puntuación, la nota y la fecha) y las recomendaciones recibidas (RF-18). Sin identificadores internos de otros usuarios ni datos de terceros. Incluye la fecha de la exportación y un número de versión del formato.
- **Eliminar** (RF-05): borra de forma **definitiva e irreversible** las recomendaciones, las evaluaciones, las categorías, los consentimientos, el perfil y la cuenta de acceso (Supabase Auth). Cierra la sesión y lleva al usuario a la página pública.
- **Confirmación con la contraseña:** eliminar exige volver a escribirla. Una sesión abierta en un ordenador ajeno o un clic accidental no bastan para destruir una cuenta. Se comprueba **en el servidor** contra Supabase Auth, con el email de la sesión (no del cliente).
- **Ubicación:** sección "Privacidad y datos" del menú lateral de Mi perfil (`/perfil/datos`).
- **Excepción a RF-12** (evaluaciones inmutables): solo aplica a **borrar la cuenta entera**. Cambiar una puntuación en la entrevista sigue sin sobrescribir nada (inserta un registro nuevo y el historial se conserva, [RF-10](RF-10-entrevista.md)); el derecho al olvido prevalece sobre la inmutabilidad y es la única vía que elimina registros. El repositorio de evaluaciones gana `deleteByUserId` solo para este caso.
- **Siempre debe existir un administrador:** el único admin no puede eliminar su cuenta hasta que exista otro (409, mensaje propio). Se comprueba en el caso de uso antes de pedir la contraseña.
- **Fuera de alcance:** copia de seguridad previa a la eliminación, período de gracia para arrepentirse, y exportación en CSV. Se pueden añadir sin cambiar el modelo.

## Criterios de aceptación

1. Given un usuario con perfil, categorías, consentimientos y evaluaciones
   When exporta sus datos
   Then descarga un JSON con todo eso (categorías y evaluaciones con nombres, no solo identificadores), la fecha de exportación y la versión del formato — y nada de otros usuarios

2. Given un usuario sin perfil ni evaluaciones
   When exporta
   Then el JSON es válido, con el perfil vacío y listas vacías (no falla)

3. Given un usuario que escribe su contraseña correcta y confirma
   When elimina su cuenta
   Then se borran evaluaciones, categorías, consentimientos, perfil y usuario de acceso; la cookie de sesión se elimina; y ya no puede iniciar sesión con esas credenciales

4. Given una contraseña incorrecta o vacía
   When intenta eliminar
   Then se rechaza sin borrar **nada** y se le dice que la contraseña no es correcta

5. Given otros usuarios registrados
   When uno elimina su cuenta
   Then los datos y cuentas de los demás quedan intactos

6. Given un fallo a mitad del borrado (p. ej. la base de datos no responde)
   When el usuario vuelve a intentarlo
   Then el borrado se completa (los pasos son repetibles: primero los datos, la cuenta de acceso al final)

7. Given un usuario sin sesión
   When llama a exportar o eliminar
   Then recibe 401 y no ocurre nada

8. Given el único administrador
   When intenta eliminar su cuenta
   Then se rechaza (409) con un mensaje que explica que siempre debe existir un administrador y que debe crear otro antes; no se borra nada ni se le pide la contraseña

9. Given un administrador y existe otro administrador
   When elimina su cuenta
   Then funciona como para cualquier usuario

## Notas de diseño

- **Orden del borrado:** datos primero (evaluaciones → categorías → consentimientos → perfil), cuenta de acceso **la última**. Si algo falla antes de borrar la cuenta, el usuario sigue pudiendo entrar y repetirlo; al revés dejaría datos huérfanos sin dueño que pueda pedir su borrado. Las claves foráneas de la base de datos ya tienen `on delete cascade` sobre `auth.users` como red de seguridad, pero el caso de uso no depende de ello (los fakes en memoria no tienen cascada).
- **Contraseña:** se comprueba reutilizando `iniciarSesion` de `AuthProvider`. Crea un token de sesión que se descarta; a cambio no hay un método nuevo en el puerto.
- **Caso de uso en `cuentas`, datos de otros módulos por sus puertos:** `ExportUserData` y `DeleteAccount` orquestan los repositorios de perfil, categorías, consentimientos y evaluaciones (mismo patrón que `ActivateCategory` con el consentimiento).
- **Función serverless:** las dos acciones (`export-data`, `delete-account`) van en `api/accounts/[action].ts`; no añaden funciones (ADR-03 §6bis).
- **Caché del frontend:** al eliminar se vacía entera (`queryClient.clear()`).

## Historial de cambios

- **v1.0 (20 sept. 2026)** — versión inicial.
- **v1.1 (20 sept. 2026)** — regla del último administrador (criterios 8 y 9) y aclaración de que la excepción a RF-12 es solo el borrado de cuenta.
- **v1.2 (20 sept. 2026)** — el módulo de recomendaciones (RF-18) entra en la exportación y en el borrado (`recommendations`, con `deleteByUserId`).
