# Plan de seguridad — revisión y refuerzo

**Fecha:** 11 de octubre de 2026
**Para qué:** revisar la seguridad de MyLifeMirror con los temas del módulo 8 del máster (arquitectura e infraestructura seguras, autenticación y credenciales, APIs, validación de entradas) y con las preguntas del autor, y dejar un plan por pasos. El proyecto es pequeño y muchas capas no son imprescindibles; se aplican las que caben para aprenderlas y para dejar la app lo mejor protegida posible.
**Cómo se usa:** el apartado 4 es la lista de pasos. Cada paso se hace por separado, con su test cuando toca código, y se marca aquí al terminarlo. Los apartados 1 y 2 describen la app **antes** de aplicar el plan; el estado actual de cada hallazgo está en el apartado 3.
**Relacionado con:** [ADR-03](../architecture-decisions/03_Arquitectura_Software.md) (arquitectura), [ADR-04](../architecture-decisions/04_Almacenamiento_Datos.md) (datos), [ADR-05](../architecture-decisions/05_Fundamentos_IA.md) (IA), [ADR-06](../architecture-decisions/06_Autenticacion.md) (autenticación), [ADR-08](../architecture-decisions/08_Observabilidad.md) (registros).

Una aclaración de partida: **hasta hoy no había una revisión de seguridad documentada**, ni contra OWASP ni contra otro marco. Sí había decisiones de seguridad repartidas por los ADR y las historias (y una mención suelta a OWASP A09 en la administración). Este documento es la primera revisión completa.

---

## 1. De dónde partimos: lo que ya está bien

Comprobado en el código y en producción el 11 de octubre.

| Tema | Qué hay | Dónde |
|---|---|---|
| Contraseñas | No las guarda ni las cifra la app: lo hace Supabase Auth, un sistema auditado. Nunca hay contraseñas en texto plano. | ADR-06 |
| Sesión | Cookie `HttpOnly`, `Secure`, `SameSite=Lax`, de 1 hora. El navegador no puede leerla con JavaScript. | `cookies.ts` |
| Quién es el usuario | Siempre sale de la sesión verificada en el servidor, nunca del cuerpo de la petición. Una sola plantilla (`sessionHandler`) lo hace igual en los 21 controladores con sesión. | ADR-03, apartado 3.4 |
| Permisos | El rol no se puede cambiar desde la app (RNF-13). La administración comprueba el rol en el caso de uso, pide la contraseña para lo delicado y deja auditoría en la base de datos. | ADM-03 |
| Validación de entradas | Cada controlador valida el cuerpo con un esquema Zod en el servidor; las listas son cerradas (claves del catálogo). La validación del navegador es solo comodidad. | controladores |
| Base de datos | Todas las tablas tienen seguridad a nivel de fila activada y sin políticas: solo el servidor, con la clave de servicio, puede leer o escribir. Las consultas van parametrizadas (sin SQL montado a mano). | `supabase/migrations/` |
| Secretos | Fuera del código: variables de entorno en Vercel y `.env` local sin subir. La clave de servicio y la de la IA solo existen en el servidor. | `.env.example` |
| Transporte | HTTPS obligatorio, con redirección desde HTTP y HSTS (lo aporta Vercel). | producción |
| Otros orígenes | La API no envía cabeceras CORS: solo la usa la propia web. | producción |
| Interfaz | Ningún `dangerouslySetInnerHTML`, `innerHTML` ni `eval`: React escapa todo lo que escribe el usuario. En el navegador solo se guardan preferencias (idioma, menú plegado), nunca la sesión. | `src/` |
| Errores | Un fallo inesperado responde un 500 genérico y el detalle va al registro, no al usuario. | `sessionHandler` |
| IA | Opcional y desactivada por defecto; salida con esquema; filtro determinista y segunda revisión; tope de uso por usuario; crédito de prepago. | ADR-05, apartado 4.3.4 |
| Entornos | Desarrollo y tests contra un Supabase local; los tests se niegan a arrancar contra la base real. | plan de V&V |
| Cuenta | Exportación y borrado completos de los datos (RF-05). | RF-05 |

## 2. Respuestas a las preguntas del autor

### 2.1 ¿Sirven estas herramientas externas?

| Herramienta | ¿Encaja aquí? | Decisión |
|---|---|---|
| **Snyk** (dependencias y análisis del código) | Sí. Tiene plan gratuito y se usa desde la terminal. | **Se prueba** (paso 3). Necesita que el autor cree una cuenta. |
| **Funciones de seguridad de GitHub**: Dependabot, escaneo de secretos con bloqueo al subir, CodeQL | Sí, y son gratis en repositorios públicos. Hoy están **desactivadas**. | **Se activan** (paso 2). Es lo que más protege con menos esfuerzo. |
| **DevSecOps** (seguridad dentro de la integración continua) | Sí, a escala pequeña: auditoría de dependencias y análisis en cada PR. | **Se aplica** (pasos 2 y 3). |
| **OWASP SAMM** y **Microsoft SDL** | No son programas: son marcos para organizar el trabajo de seguridad de un equipo. | Se usan como guion de este documento (requisitos, diseño, verificación), sin una evaluación formal. |
| **GitHub Copilot for Security / Microsoft Security Copilot** | Productos de pago para equipos de operaciones de seguridad. | No. La revisión con IA ya se hace con el asistente del proyecto. |
| **AWS GuardDuty**, **Azure Sentinel** | Vigilan cuentas de AWS y de Azure. La app está en Vercel y Supabase. | No aplican. Su equivalente aquí son los registros de Vercel y de Supabase (paso 10). |
| **OWASP ZAP** (escáner de aplicaciones web, citado en el módulo) | Sí: prueba la app desde fuera, como un atacante. | Opcional (paso 11), contra la app local. |
| **Terraform y similares** (infraestructura como código) | La infraestructura son dos servicios gestionados. Lo que sí está en código: `vercel.json` y las migraciones. | No se añade. |

### 2.2 ¿Están protegidos los datos y los modelos frente al envenenamiento de datos?

El envenenamiento consiste en colar datos maliciosos en lo que un modelo aprende o consulta. Aquí:

- **No se entrena ni se ajusta ningún modelo**, y no hay búsqueda sobre documentos (RAG). El modelo es el de Anthropic, usado por su API con un identificador fijo. No hay nada que envenenar por esa vía.
- **El catálogo curado** (ideas, opciones, situaciones, términos de los filtros) es lo más parecido a un conjunto de datos. Vive en el repositorio: cambia solo por PR, con tests de integridad. El riesgo real es que alguien con acceso al repositorio lo altere; lo cubre el paso 2 (proteger la rama principal).
- **Las experiencias compartidas** son contenido de usuarios que leen otros usuarios. Es el punto más parecido a un envenenamiento: alguien puede intentar publicar algo dañino. Lo frenan los filtros al compartir, la vista previa, el reporte que oculta al momento y que **nunca se envían a la IA**.

### 2.3 ¿Estamos protegidos ante la inyección de instrucciones (*prompt injection*)?

Es el riesgo de que un texto del usuario contenga órdenes para el modelo ("ignora lo anterior y…"). Hay un solo sitio donde texto libre llega a la IA: **"Sugerir opciones con IA"** (RF-45), con una experiencia del diario.

- **Qué limita el daño hoy:** el modelo solo puede devolver claves, y el servidor descarta toda clave que no esté entre las opciones enviadas. Aunque la inyección convenciera al modelo, lo peor que puede pasar es que proponga una opción que no encaja, y el usuario decide si la acepta. No hay herramientas, ni acceso a datos, ni texto del modelo en pantalla.
- **Las ideas personalizadas (RF-40) no reciben texto libre**: solo textos del catálogo y opciones de listas cerradas.
- **Qué falta:** decirle al modelo de forma explícita que la experiencia es un dato y no una orden, y **medirlo**: añadir a la evaluación varios intentos de inyección (paso 8).
- **Quién puede atacar a quién:** un usuario solo puede inyectar en sus propias peticiones. Las experiencias de otros no llegan a la IA, así que no hay inyección indirecta.

### 2.4 ¿Y ante puertas traseras en librerías o modelos maliciosos?

- **Modelos:** no se descarga ni se ejecuta ningún modelo; se llama a un proveedor por HTTPS. No hay modelo que pueda venir manipulado.
- **Librerías (el riesgo real):** 14 dependencias directas de producción y 19 de desarrollo, con cientos indirectas. Lo que hay: versiones fijadas en `package-lock.json`, instalación exacta en CI (`npm ci`), y la decisión de no instalar el CLI de Vercel por su árbol de dependencias. Lo que falta: avisos automáticos de vulnerabilidades, auditoría en cada PR y revisión de las actualizaciones. Hoy `npm audit` da **2 vulnerabilidades altas** en dependencias de desarrollo, con arreglo disponible (pasos 2 y 3).

### 2.5 ¿Qué protección hay frente a MITRE ATT&CK?

ATT&CK es un catálogo de tácticas y técnicas de atacantes reales. Sirve para preguntarse "¿y si intentan esto?". Las que tienen sentido en una app web como esta:

| Técnica | Qué sería aquí | Protección actual | Hueco |
|---|---|---|---|
| T1110 Fuerza bruta | Probar contraseñas en el inicio de sesión | La de Supabase, por IP | Supabase ve la IP de Vercel, no la del atacante: **sin límite propio** (paso 5, hecho). Contraseñas débiles permitidas (paso 4, hecho). |
| T1078 Cuentas válidas | Entrar con credenciales robadas o reutilizadas | Sesión de 1 hora | Sin segundo factor ni aviso de inicios de sesión. Contraseñas (paso 4). |
| T1190 Explotar una aplicación expuesta | Inyección, saltarse permisos | Validación con esquema, usuario desde la sesión, seguridad por filas | Longitudes máximas y cabeceras (pasos 6 y 7). |
| T1552 Credenciales sin proteger | Claves en el código o en el historial | `.env` sin subir | Hubo un token en el historial (ya revocado y limpiado). Falta el bloqueo automático al subir (paso 2). |
| T1195 Cadena de suministro | Una dependencia maliciosa | Versiones fijadas | Sin avisos ni auditoría automática (pasos 2 y 3). |
| T1059.007 JavaScript en el navegador (XSS) | Ejecutar código en la sesión de otra persona | React escapa el contenido; cookie `HttpOnly` | Sin política de seguridad de contenido (paso 7). |
| T1539 Robo de la cookie de sesión | Leer la cookie | `HttpOnly`, `Secure` | — |
| T1565 Manipulación de datos | Cambiar datos de otro usuario | Cada consulta filtra por el usuario de la sesión | — |
| T1499 Agotar el servicio | Muchas peticiones, o gastar el crédito de la IA | Tope diario de IA, crédito de prepago | Sin límite general de peticiones (paso 5). |
| T1485 Destrucción de datos | Borrar datos | Borrado de cuenta con contraseña | **Sin copias de seguridad** en el plan gratuito (paso 10). |
| T1566 Suplantación (*phishing*) | Engañar al autor para robarle el acceso a GitHub, Vercel o Supabase | — | Segundo factor en esas cuentas (paso 1). |

### 2.6 OWASP Top 10: ¿la versión de 2025?

No se había revisado contra ninguna versión. Esta es la revisión contra la **edición de 2025**:

| Categoría (2025) | Estado | Hueco y paso |
|---|---|---|
| A01 Control de acceso roto | Bien | — |
| A02 Configuración de seguridad incorrecta | **A mejorar** | Faltan cabeceras; las respuestas de la API con datos personales no llevan `no-store` (paso 7). |
| A03 Fallos en la cadena de suministro de software | **A mejorar** | Sin avisos ni auditoría automática; 2 vulnerabilidades altas en desarrollo (pasos 2 y 3). |
| A04 Fallos criptográficos | Bien | Delegado en Supabase y en HTTPS. |
| A05 Inyección | Bien | Añadir longitudes máximas (paso 6). |
| A06 Diseño inseguro | Aceptable | Sin verificación del email al registrarse (decisión de ADR-06; paso 9). |
| A07 Fallos de autenticación | **A mejorar** | Contraseñas débiles y sin límite de intentos (pasos 4 y 5). |
| A08 Fallos de integridad del software o de los datos | **A mejorar** | La rama principal no está protegida (paso 2). |
| A09 Fallos de registro y alerta | Aceptable | Hay registros y auditoría, pero ninguna alerta (paso 10). |
| A10 Mal manejo de condiciones excepcionales | Bien | 500 genérico, caída al texto curado, tiempos límite. |

Como la app usa un modelo de lenguaje, también se ha mirado el **OWASP Top 10 para aplicaciones con LLM (2025)**: inyección de instrucciones (apartado 2.3), revelación de información sensible (se envía lo mínimo y se quitan datos de contacto), cadena de suministro (2.4), envenenamiento de datos (2.2), tratamiento de la salida (esquema, filtro y revisión), autonomía excesiva (ninguna: el modelo no ejecuta nada), y consumo sin límite (tope diario y prepago). No aplican los de vectores ni el de fuga del prompt del sistema: no hay RAG y el prompt no contiene secretos.

### 2.7 Contraseñas

**Antes:** mínimo 8 caracteres y nada más ("Test1234" valía).

**Decisión del autor (11 oct.):** combinar todas las técnicas, no elegir entre longitud y tipos de caracteres. Aplicada en [SEC-01](../user-stories/SEC-01-contrasenas-fuertes.md):

1. entre 12 y 72 caracteres;
2. minúscula, mayúscula, número y símbolo;
3. sin secuencias ni repeticiones (`1234`, `abcd`, `qwer`, `aaa`);
4. que no sea una palabra común, aunque lleve números, símbolos o sustituciones (`P4ssw0rd!2026`);
5. que no contenga el nombre ni el email.

**¿Hay una expresión regular que evite `Test1234!`?** No una sola. Una expresión regular comprueba la *forma* (hay una mayúscula, hay un número) y `Test1234!` tiene buena forma. Lo que la delata es el *contenido*: una palabra de diccionario, una secuencia y poca longitud. Por eso la regla son cinco comprobaciones pequeñas en una función (`passwordPolicy.ts`), y esa contraseña falla tres de ellas.

**Cómo se explica:** en el registro y al cambiar la contraseña, los requisitos se ven desde el principio y se van marcando; hay un botón para ver lo escrito. En el inicio de sesión, ningún detalle: siempre "email o contraseña incorrectos". Las cuentas que ya existen no cambian.

**Límite conocido:** no se comprueba contra bases de datos de contraseñas filtradas (en Supabase es de pago). La lista de comunes es propia y corta (183 palabras base, en español y en inglés).

### 2.8 Patrones inseguros en el código

Revisión del 11 de octubre. Ningún fallo grave. Los hallazgos están en el apartado 3.

## 3. Hallazgos

Ordenados por importancia. "Paso" remite al apartado 4. Estado a 11 de octubre.

| # | Hallazgo | Importancia | Paso | Estado |
|---|---|---|---|---|
| H1 | Las funciones de seguridad de GitHub están desactivadas (Dependabot, escaneo de secretos, bloqueo al subir) y la rama principal no está protegida, en un repositorio que ya es público. | Alta | 2 | Configuración añadida al repositorio; **falta activarlas en GitHub (autor)** |
| H2 | No hay límite propio de intentos en inicio de sesión, registro y recuperación de contraseña. El de Supabase va por IP, y la IP que ve es la de Vercel. | Alta | 5 | **Corregido** (SEC-02) |
| H3 | Se aceptan contraseñas débiles (8 caracteres sin más comprobación). | Media | 4 | **Corregido** (SEC-01) |
| H4 | Faltan cabeceras de seguridad (CSP, `nosniff`, protección contra marcos, `Referrer-Policy`, `Permissions-Policy`) y las respuestas de la API no llevan `no-store`. | Media | 7 | **Corregido** (SEC-03) |
| H5 | `npm audit`: 2 vulnerabilidades altas en dependencias de desarrollo. No se audita en CI. | Media | 3 | **Corregido**; auditoría en cada PR |
| H6 | Varios esquemas de entrada no limitan la longitud. | Baja | 6 | **Corregido** (SEC-03) |
| H7 | Los clientes de Supabase del servidor guardan la sesión en memoria, y el de autenticación inicia sesiones de usuarios con ese mismo cliente. | Baja | 6 | **Corregido** (SEC-03) |
| H8 | El registro dice si un email ya tiene cuenta. | Baja | 4 y 9 | **Mitigado**: mensaje neutro y tope de 5 registros por hora e IP. Cerrarlo del todo exige verificar el email |
| H9 | No se verifica el email al registrarse (decisión de ADR-06). | Baja | 9 | Abierto: decisión del autor |
| H10 | El prompt de las sugerencias no dice que la experiencia es un dato, y no hay casos de inyección en la evaluación. | Baja | 8 | **Corregido** (SEC-04) y medido con el modelo real: 5 de 5 intentos resistidos |
| H11 | No hay comprobación del origen de la petición en las acciones que cambian datos. | Baja | 6 | **Corregido** (SEC-03) |
| H12 | Sin copias de seguridad (plan gratuito de Supabase) ni alertas. | Baja | 10 | **Mitigado**: `npm run backup:db`. Alertas, abierto |
| H13 | Credenciales del autor: un token clásico de GitHub sin caducidad y con todos los permisos; credenciales antiguas de MongoDB en el `.env` local. | Media | 1 | MongoDB, hecho. **Token y segundo factor, pendientes (autor)** |
| H14 | *(Encontrado al aplicar el plan.)* El cambio de contraseña acepta cualquier token de sesión válido, no solo el de un enlace de recuperación. Quien robara una sesión podría cambiar la contraseña sin saber la anterior. La cookie es `HttpOnly`, así que robarla exige otro fallo antes. | Baja | — | Abierto. Arreglo: exigir que el token sea de recuperación; hay que probarlo con un correo real antes de tocarlo |
| H15 | *(Ídem.)* Supabase aplica su propio tope de inicios de sesión por IP, y para él todos los usuarios son la IP de Vercel: un atacante que lo agotara dejaría a todos sin poder entrar un rato. | Baja | 5 | **Mitigado**: el tope propio (30 por IP cada 15 min) corta antes |
| H16 | *(Encontrado por Snyk.)* zod anota un error por cada elemento de una lista que no encaja, sin tope (CVE-2023-54404, sin versión corregida): un cuerpo de 4,5 MB consumía 1,4 GB de memoria en la función. | Media | 3 y 6 | **Mitigado**: tope de tamaño del cuerpo antes de validar y longitud máxima en las listas. Actualizar zod cuando haya corrección |

## 4. Plan por pasos

"Autor" = lo hace el autor en una web o en su cuenta; "Código" = cambio en el repositorio, con su test.

- [ ] **Paso 1. Cuentas y credenciales del autor** (Autor). Ver la guía 4.1.
  - [x] Credenciales de MongoDB borradas.
  - [ ] Segundo factor en GitHub, Vercel, Supabase y Anthropic. **Aplazado por el autor a después de la entrega** (decisión del 11 oct.); hasta entonces es el riesgo abierto más importante del plan.
  - [ ] Sustituir el token clásico de GitHub. En marcha: uno *fine-grained* solo para este repositorio (permisos en la guía 4.1); el clásico se borra cuando el autor haya revisado qué más lo usa.
- [ ] **Paso 2. Seguridad del repositorio en GitHub** (Autor, guía 4.2).
  - [x] `.github/dependabot.yml`: actualizaciones semanales de npm (agrupadas) y mensuales de las acciones, hacia `develop`.
  - [x] Workflow *Seguridad*: `npm audit` y CodeQL en cada PR, en cada push a `main` y `develop`, y cada lunes.
  - [x] Regla "Proteger main" creada (11 oct.): cambios solo por PR, sin *force push* ni borrado de la rama.
  - [x] Avisos de Dependabot y escaneo de secretos con bloqueo al subir, activados en GitHub (confirmado por el autor, 11 oct.).
  - [ ] **Después de subir la rama**, cuando el workflow *Seguridad* haya corrido una vez: volver a la regla "Proteger main", marcar *Require status checks to pass* y añadir *Dependencias (npm audit)*, *Código (CodeQL)* y el de *E2E con api*. Antes no se puede: GitHub no ofrece un control que nunca se ha ejecutado, y exigir uno que no informa bloquea la PR.
  - [ ] Después del primer push: revisar la pestaña **Security** (resultados de CodeQL y avisos de Dependabot) y anotar aquí lo que salga.
- [x] **Paso 3. Dependencias y análisis del código.**
  - [x] Las 2 vulnerabilidades, corregidas (`npm audit fix`, sin cambios de versión mayor). `npm run audit` da 0.
  - [x] **Snyk probado** (11 oct.): un aviso real en zod, ya mitigado (H16); el análisis de código, 70 avisos y ninguno real. Detalle y valoración en la guía 4.3.
- [x] **Paso 4. Contraseñas fuertes** ([SEC-01](../user-stories/SEC-01-contrasenas-fuertes.md)). Política en el dominio, formularios con los requisitos a la vista, contraseña temporal de la administración conforme, mensaje neutro para el email repetido. Supabase local, mínimo 12.
- [x] **Paso 5. Límite de intentos** ([SEC-02](../user-stories/SEC-02-limite-de-intentos.md)). Por IP y por cuenta, en la base de datos. La función SQL se ha probado contra el Supabase local: de 10 peticiones simultáneas con tope 3, pasan 3. **Requiere la migración 0021 en producción.**
- [x] **Paso 6. Entradas y sesión** ([SEC-03](../user-stories/SEC-03-cabeceras-y-peticiones.md)). Longitudes máximas, cuerpo de 32 000 caracteres como mucho, comprobación de origen, cliente del servidor sin sesión.
- [x] **Paso 7. Cabeceras de seguridad** (SEC-03). En `vercel.json`. Verificadas sirviendo el build de producción con ellas y pasándole los E2E: 22 de 22, sin ningún bloqueo de la política de contenido. `smoke:prod` las vigila tras cada despliegue.
- [x] **Paso 8. IA: inyección de instrucciones** ([SEC-04](../user-stories/SEC-04-ia-inyeccion-de-instrucciones.md)).
  - [x] Instrucción explícita en el prompt y cinco casos de inyección en la evaluación.
  - [x] Evaluación con el modelo real: **5 de 5 intentos de inyección resistidos y 0 claves inventadas (11 oct., Claude Haiku 5.5; dos pasadas, 2,5 céntimos en total)**. En la primera pasada un caso salió como fallo y no lo era: la experiencia real que acompañaba a la orden ("caminar por el monte") respalda dos opciones, las mismas que devuelve sin la orden; se corrigió el criterio, no el prompt.
- [ ] **Paso 9. Registro y verificación del email** (Decisión del autor). Verificar el email cerraría H8 y H9, a cambio de un paso más al registrarse (y de configurar el envío de correo en producción). Recomendación: dejarlo para después de la entrega.
- [ ] **Paso 10. Copias y vigilancia.**
  - [x] `npm run backup:db`: copia en `backups/` (fuera de Git). Probado contra el Supabase local.
  - [ ] Hacer la primera copia de producción y guardarla en un sitio cifrado (Autor).
  - [ ] Revisar qué alertas gratuitas dan Vercel y Supabase.
- [ ] **Paso 11. Opcional: escáner externo.** OWASP ZAP contra la app local.
- [ ] **Paso 12. Cierre.** Riesgos que se aceptan y por qué, tras los pasos del autor.

### 4.1 Guía del paso 1: cuentas

Quien entra en estas cuentas controla el código, el despliegue o los datos; ningún cambio en la app lo compensa.

| Cuenta | Dónde se activa el segundo factor |
|---|---|
| GitHub | Settings → Password and authentication → Two-factor authentication |
| Vercel | Account Settings → Authentication → Two-Factor Authentication |
| Supabase | Account → Security → Multi-factor authentication |
| Anthropic Console | Depende del método de acceso: si entras con Google, es el segundo factor de la cuenta de Google |

Mejor con una app de códigos (o una llave física) que por SMS, y guardando los códigos de recuperación fuera del ordenador.

**Token de GitHub:** en Settings → Developer settings → Personal access tokens, crear uno *fine-grained* con acceso solo a este repositorio ("Only select repositories") y caducidad (90 días, por ejemplo). Permisos de repositorio, y ninguno de cuenta:

| Permiso | Nivel | Para qué |
|---|---|---|
| Metadata | Lectura (lo pone GitHub solo) | Obligatorio para cualquier token |
| Contents | Lectura y escritura | `git pull` y `git push` |
| Workflows | Lectura y escritura | Subir cambios en `.github/workflows/`; sin él GitHub rechaza ese push |
| Pull requests | Lectura y escritura | Solo si se crean o consultan PRs desde la terminal (`gh`) |

Todo lo demás, sin acceso. Cambiarlo allí donde se use el clásico y, cuando se sepa qué más dependía de él, borrar el clásico.

### 4.2 Guía del paso 2: GitHub

En el repositorio, **Settings → Advanced Security** (o "Code security"):

1. **Dependabot alerts** y **Dependabot security updates**: activar. (Las actualizaciones de versión ya las define `dependabot.yml`.)
2. **Secret Protection** (escaneo de secretos) y **Push protection**: activar. La segunda rechaza un `git push` que lleve una clave reconocible: es lo que habría parado el token que acabó en el historial.
3. **Code scanning**: no elegir la configuración por defecto; ya la hace el workflow *Seguridad*, con reglas ampliadas.

En **Settings → Rules → Rulesets**, una regla para `main`:

- exigir una PR para cambiarla (sin aprobaciones obligatorias: solo hay una persona);
- exigir que pasen los controles *Dependencias (npm audit)*, *Código (CodeQL)* y *E2E con api*;
- bloquear los *force push* y el borrado de la rama.

Los resultados se ven en la pestaña **Security** del repositorio.

### 4.3 Guía del paso 3: Snyk

Snyk hace dos cosas que aquí interesan: mirar las dependencias (como `npm audit`, con su propia base de datos y con propuestas de arreglo) y analizar el código en busca de patrones inseguros (como CodeQL).

```bash
npx snyk auth        # abre el navegador: crear la cuenta gratuita o entrar con GitHub
npx snyk test        # dependencias
npx snyk code test   # análisis del código (hay que activar "Snyk Code" en la web la primera vez)
```

Se usa con `npx`, sin instalarlo en el proyecto, por el mismo motivo que el CLI de Vercel. Qué anotar aquí al probarlo: qué encuentra cada comando, cuánto de ello es real y si ve algo que `npm audit` y CodeQL no.

**Resultado de `snyk test` (11 oct. 2026):** 111 dependencias, **1 aviso alto**, en `zod@4.6.2` (CVE-2023-54404, publicado el 5 oct.): al validar una lista, zod anota un error por cada elemento que no encaja, sin tope; una lista enorme agota la memoria del proceso. Afecta a todas las versiones y no hay versión corregida. `npm audit` no lo ve (su base de datos no lo recoge todavía): es justo lo que aporta una segunda herramienta.

- **¿Nos afectaba?** Sí, antes de este plan. Medido en local con el esquema de la entrevista: un cuerpo de 4,5 MB (el máximo que admite Vercel) son 2,25 millones de elementos, 1,2 segundos y **1,4 GB de memoria**: suficiente para tumbar la función. Lo podía hacer cualquier usuario con sesión (la sesión se comprueba antes de validar).
- **¿Y ahora?** No. El tope de 32 000 caracteres por cuerpo (SEC-03, paso 6) se aplica antes de validar: en el peor caso son 16 000 elementos, 13 ms y 10 MB. Además, la única lista de entrada que no tenía longitud máxima (las puntuaciones de una entrevista) ya la tiene (100).
- **Qué queda:** nada que hacer hasta que zod publique una corrección; entonces, actualizar. Las listas que devuelve el modelo de IA también pasan por zod, pero su tamaño lo limita el máximo de tokens de la respuesta.

**Resultado de `snyk code test` (11 oct. 2026):** 70 avisos (0 altos, 2 medios, 68 bajos), **todos del mismo tipo y ninguno real**: "contraseña escrita en el código".

| Dónde | Cuántos | Qué es |
|---|---|---|
| `tests/` y `e2e/` | 68 (bajos) | Contraseñas de ejemplo de los tests, contra cuentas que solo existen en memoria o en el Supabase local |
| `e2e/api/pages/users.ts` | 1 (medio) | La contraseña de los usuarios que crean los E2E en la base local, que se vacía en cada ejecución |
| `scripts/smoke-prod.mjs` | 1 (medio) | La contraseña falsa con la que el *smoke* comprueba que el inicio de sesión responde 401 |

En `src/` y en `api/`, el código que se ejecuta en producción, **cero avisos**: ni inyección, ni datos sin validar, ni secretos. Coincide con la revisión manual del apartado 2.8.

**Valoración de la herramienta.** Lo mejor ha sido el análisis de dependencias: encontró el aviso de zod que `npm audit` no tenía, y era real. El análisis de código no ha aportado nada aquí, y su ruido (70 avisos para 0 problemas) enseña algo útil: una herramienta no distingue una contraseña de ejemplo de una de verdad, y hay que leer los resultados antes de alarmarse o de ignorarlos en bloque. No se añade a la integración continua: ese hueco ya lo cubre CodeQL, gratis para repositorios públicos y sin dar a un tercero acceso a la cuenta. Sí merece repetir `npx snyk test` de vez en cuando, como segunda opinión sobre las dependencias.

**Decisión del autor (11 oct.):** era una prueba de la herramienta y no se vuelve a ejecutar por ahora. Se retira su acceso: la autorización de Snyk en la cuenta de GitHub y la credencial guardada en el ordenador. Si se retoma, basta repetir `npx snyk auth`.

### 4.4 Antes de desplegar esta versión

1. Ejecutar la **migración 0021** (`supabase/migrations/0021_attempt_counters.sql`) en el SQL Editor de Supabase. Sin ella el tope de intentos no funciona (el servidor deja pasar y lo anota en el registro).
2. Opcional, en Supabase → Authentication → Sign In / Providers → Email: subir la longitud mínima de contraseña a 12. Los tipos de caracteres, mejor dejarlos sin exigir ahí: los comprueba la app, con mensajes propios.
3. Tras desplegar, `npm run smoke:prod` comprueba las cabeceras; y conviene probar a mano un registro con una contraseña débil y otro con una buena.

## 5. Lo que se deja fuera, y por qué

- **Segundo factor para los usuarios de la app.** Supabase lo permite, pero añade fricción a una app de uso personal. Se valorará solo para administradores.
- **Vigilancia tipo GuardDuty o Sentinel, e infraestructura como código.** No hay servidores ni nube propia que vigilar o definir.
- **Cifrado propio de datos en la base.** Supabase cifra en reposo y en tránsito; cifrar además las experiencias pediría gestionar claves, con poco beneficio aquí.
- **Cortafuegos de aplicación de pago.** Fuera del plan gratuito.

Estas decisiones se revisan si la app pasa de ser un TFM a un producto con usuarios reales.

## Historial de cambios

- **v1.0 (11 oct. 2026)** — versión inicial: revisión del código y de producción, respuestas a las preguntas del autor, hallazgos y plan en 12 pasos. Nada aplicado todavía.
- **v1.1 (11 oct. 2026)** — aplicados los pasos de código (3 a 8 y 10): contraseñas, límite de intentos, entradas, cabeceras, IA y copia de seguridad, con sus historias SEC-01 a SEC-04. Estado de cada hallazgo, dos hallazgos nuevos (H14, H15), guías de los pasos del autor y lista previa al despliegue. Apartado 2.7 con la decisión del autor sobre las contraseñas.
- **v1.2 (11 oct. 2026)** — el autor aplaza el segundo factor a después de la entrega; permisos exactos del token *fine-grained* en la guía 4.1.
- **v1.3 (11 oct. 2026)** — paso 2: regla de `main` creada; lo que queda para después de subir la rama (controles obligatorios y revisar la pestaña Security).
- **v1.4 (11 oct. 2026)** — resultado de `snyk test`: aviso alto en zod (H16), medido y mitigado por el tope de tamaño del paso 6; longitud máxima en la lista que faltaba.
- **v1.5 (11 oct. 2026)** — resultado de `snyk code test` (70 avisos, todos contraseñas de ejemplo en tests; ninguno en el código de producción) y valoración de la herramienta. Paso 3 cerrado.
- **v1.6 (11 oct. 2026)** — paso 8 cerrado con la evaluación real (5 de 5 inyecciones resistidas); avisos y escaneo de GitHub confirmados; Snyk queda como prueba hecha, con el acceso retirado.
