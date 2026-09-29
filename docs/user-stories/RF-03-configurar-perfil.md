# Historia: Configurar perfil

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-03, RF-01, [05_Diagrama_Clases.md](../requirements-analysis/05_Diagrama_Clases.md) (RD-01, `Usuario`)

Como usuario recién registrado (o que quiere corregir sus datos)
Quiero configurar mi perfil (nombre, fecha de nacimiento, género opcional, zona horaria)
Para que la app me trate como a mí y calcule cosas dependientes de mi edad/zona horaria correctamente

## Alcance

Aunque el diagrama de clases modela estos campos sobre la propia entidad `Usuario` (RD-01), viven en el módulo `accounts` (misma sección de requisitos 2.1) pero en su propio sub-almacén (`ProfileRepository`, adaptador en memoria) — no en Supabase Auth, que solo custodia identidad y credenciales (ADR-06). `avatarId` (RF-26) queda fuera: es Should, Ciclo 1 no lo cubre todavía.

**`name` se captura ya en el registro (RF-01)**, no aquí: sin él, el `Header` tendría que mostrar el email en bruto hasta que el usuario pasara por esta pantalla, y eso es peor experiencia que pedirlo una vez, al principio. El resto (`birthDate`, `gender`, `timeZone`) se rellena en esta pantalla, más tarde. Por eso el caso de uso `UpdateProfile` es un **upsert parcial**: cualquier subconjunto de campos es válido, y se fusiona sobre lo que ya hubiera — `RegisterUser` lo llama con solo `{ name }` al crear la cuenta; esta pantalla lo vuelve a llamar después con el resto.

## Criterios de aceptación

1. Given un registro nuevo (RF-01, con nombre)
   When se completa el registro
   Then existe un perfil con ese nombre, sin fecha de nacimiento/género/zona horaria todavía

2. Given un usuario autenticado sin el resto del perfil configurado todavía
   When abre la pantalla de perfil
   Then ve su nombre ya relleno, el resto vacío, y la zona horaria pre-rellenada a partir de la detectada por el navegador

3. Given un usuario autenticado que rellena fecha de nacimiento y zona horaria (género es opcional)
   When guarda el formulario
   Then esos campos se guardan sobre su perfil existente sin perder el nombre, y una confirmación se lo indica

4. Given un usuario autenticado que ya tiene un perfil completo
   When vuelve a abrir la pantalla y cambia un campo
   Then solo ese campo cambia — los demás quedan igual que estaban (upsert parcial, no sobrescritura total)

5. Given un nombre vacío, una fecha de nacimiento no válida (futura, o que da una edad fuera de 0-120), o una zona horaria que no es un identificador IANA válido
   When se intenta guardar
   Then se rechaza con un error de validación, sin llegar al repositorio

6. Given una petición a los endpoints de perfil sin sesión activa
   When se intenta leer o guardar
   Then se responde 401 sin exponer ni tocar ningún dato

## Nota de diseño — selector de fecha nativo, sin librería de calendario

`birthDate` usa `<input type="date">` (vía `TextField type="date"` de MUI) — el navegador ya da un calendario nativo accesible en escritorio y móvil, sin instalar `@mui/x-date-pickers` ni una librería de fechas (`dayjs`/`date-fns`) solo para esto (mismo criterio de "alternativa nativa primero", ADR-02). Se guarda como texto ISO `"YYYY-MM-DD"`, el mismo formato que ya usa el input nativo.

## Nota de diseño — validación de zona horaria sin librería nueva

`Intl.supportedValuesOf("timeZone")` (nativo, disponible en Node 18+ y navegadores modernos) da la lista completa de identificadores IANA válidos — se usa para validar en el backend y para poblar el `Autocomplete` en el frontend, sin añadir ninguna dependencia nueva.

## Nota de diseño — sin política de edad mínima

RF-03 no especifica una edad mínima de uso, y no hay ningún RN/RES existente sobre menores de edad — se valida que la fecha de nacimiento dé una edad razonable (0-120) por sanidad de datos, no como una verificación de mayoría de edad. Si se quiere una política real de edad mínima (relevante de cara a RGPD y consentimiento parental), es una decisión de negocio pendiente de definir explícitamente, no asumida aquí.

## Historial de cambios

- **v1.0 (14 sept. 2026)** — versión inicial: perfil con `edad` (entero) como campo obligatorio junto con `nombre`/`zonaHoraria`, todo en un único `ConfigurarPerfil` que exigía todos los campos a la vez.
- **v2.0 (14 sept. 2026)** — `edad` sustituida por `birthDate` (selector de fecha nativo); `name` se mueve al registro (RF-01); `ConfigurarPerfil`/`ObtenerPerfil` se renombran a `UpdateProfile`/`GetProfile` (inglés en código, AGENTS.md) y `UpdateProfile` pasa a ser upsert parcial en vez de exigir todos los campos juntos.
