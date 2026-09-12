# ADR-04: Almacenamiento de Datos

**Estado:** Aceptado
**Fecha:** 10 de septiembre de 2026
**Relacionado con:** [01_Stack_Tecnologico.md](01_Stack_Tecnologico.md), [02_Principios_Diseño.md](02_Principios_Diseño.md), [03_Arquitectura_Software.md](03_Arquitectura_Software.md), [05_Diagrama_Clases.md](../requirements-analysis/05_Diagrama_Clases.md), RES-03, RES-04, RNF-04, RNF-05, RNF-11, RNF-12, RF-34

---

## 1. Contexto

RES-03 exige capa gratuita, sin excepciones. El modelo de dominio ([05_Diagrama_Clases.md](../requirements-analysis/05_Diagrama_Clases.md)) es bastante relacional (relaciones tipo FK, `Conexión` autorreferencial), y RF-34 necesita filtrar el historial de recomendaciones por estado, categoría y fecha a la vez. RES-04/RD-06 exigen tratamiento reforzado para categorías de datos especial (Art. 9 RGPD); RNF-11 pide auditoría de accesos/modificaciones a esos datos.

Gracias a [03_Arquitectura_Software.md](03_Arquitectura_Software.md) (Clean Architecture, patrón Repository como puerto), esta decisión queda parcialmente protegida: la base de datos concreta vive por completo dentro del adaptador de infraestructura, sin filtrarse al dominio ni a la aplicación. Eso reduce el coste de esta elección frente a lo que sería en una arquitectura menos disciplinada.

## 2. Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Firebase (Firestore)** | Tiempo real maduro, Cloud Functions en Node/TS nativo | RF-34 choca con las limitaciones reales de Firestore (no permite combinar filtros de desigualdad en varios campos en una sola consulta) |
| **Supabase (Postgres)** | Encaje natural con el modelo relacional, RLS potente, SQL resuelve RF-34 sin esfuerzo | Tecnología nueva para el usuario; el proyecto ya asume una arquitectura nueva (Clean Architecture) — apilar dos incertidumbres grandes a la vez es un riesgo innecesario para RES-01 |
| **MongoDB Atlas** ✅ | El usuario ya lo conoce (experiencia previa con Mongo/Atlas) — reduce riesgo justo donde ADR-01 ya estableció que debía reducirse; capa gratuita M0 permanente, sin fecha de caducidad ni auto-pausa; su lenguaje de consultas sí resuelve RF-34 (a diferencia de Firestore) mediante índices compuestos | Sin esquema forzado por la base de datos, sin RLS/Security Rules equivalente, sin auditoría nativa en el tier gratuito — mitigaciones en §4 |
| **Autoalojado (Postgres/Mongo en una VM propia)** | Control total | Carga operativa (backups, parches, escalado) desproporcionada para RES-02, mismo argumento ya usado en ADR-03 para descartar infraestructura propia |

## 3. Decisión: MongoDB Atlas (tier M0, gratuito)

La razón de fondo no es técnica, es de gestión de riesgo: el proyecto ya apiló una incertidumbre grande y deliberada (Clean Architecture completa, ADR-03) para aprender. Añadir una segunda incertidumbre grande (una base de datos nueva) sobre la misma fecha fija (RES-01) sería innecesario, cuando la alternativa conocida (MongoDB) cumple perfectamente los requisitos reales del proyecto. Y gracias a esa misma Clean Architecture, el coste de no elegir la opción "más relacionalmente pura" (Postgres) queda contenido dentro del adaptador de infraestructura — no se paga en el resto del sistema.

Aclaración importante sobre RF-34: la reserva inicial sobre "NoSQL" en este ADR era en realidad una reserva sobre **Firestore específicamente** (sus filtros de desigualdad no se pueden combinar en varios campos). MongoDB no tiene esa limitación — su framework de consultas/agregación soporta filtros combinados de rango e igualdad con índices compuestos, así que RF-34 se resuelve sin problema.

Sobre el coste económico, que es el criterio que más pesa ahora mismo: el tier M0 de Atlas es **gratuito de forma permanente** (no es una prueba con caducidad), con 512MB de almacenamiento, cifrado en reposo (AES-256) y TLS en tránsito incluidos de serie — suficiente para el volumen de un piloto de TFM. Además, a diferencia del tier gratuito de Supabase (que pausa el proyecto tras ~1 semana de inactividad), un clúster M0 de Atlas no se autopausa — relevante porque este proyecto se trabaja de forma intermitente, encajado en el calendario del máster.

## 4. Cómo se mitigan las carencias de MongoDB para este proyecto

| Carencia | Mitigación |
|---|---|
| **Sin esquema forzado por la base de datos** | **Zod se vuelve la fuente de verdad de la estructura de datos** — no es una elección ligada a MongoDB (funcionaría igual con cualquier otra base), pero aquí hace un trabajo que Postgres habría hecho parcialmente gratis. Se valida con Zod tanto al escribir (antes de persistir) como al leer (antes de mapear el documento a una Entidad/Value Object de dominio), por si hay datos ya guardados que no encajan con el esquema actual. |
| **`Conexión` autorreferencial** | Se modela como colección con referencias (`usuario_a`, `usuario_b` como ObjectId), resuelta con `$lookup` o dos consultas — más manual que una FK de SQL, perfectamente viable al volumen de este proyecto. |
| **Sin RLS/Security Rules equivalente** | La autorización se aplica íntegramente en la capa de Casos de Uso (Clean Architecture ya lo prefería así — es una decisión explícita de la aplicación, no magia de la base de datos). |
| **Sin auditoría nativa en el tier gratuito** (RNF-11) | Un caso de uso `RegistrarAuditoria` explícito, disparado como evento de dominio (mismo mecanismo de Outbox ya diseñado en [03_Arquitectura_Software.md](03_Arquitectura_Software.md) §3.4) cada vez que se accede o modifica un dato de categoría especial (RD-06). |
| **Cifrado de campos sensibles** (RES-04, RD-06) | Cifrado a nivel de aplicación en el adaptador para los campos marcados como sensibles, suficiente para el Ciclo 1. Client-Side Field Level Encryption de MongoDB queda como opción a valorar en una fase posterior si el alcance lo justifica — no se implementa ahora (YAGNI). |
| **Exportación de datos** (RNF-12) | Los datos ya pasan por DTOs con Zod en la capa de aplicación — exportar a JSON es directo; CSV requiere un mapeo adicional sencillo. |

## 5. Detalle de implementación (para cuando empecemos Ciclo 1)

- **Driver:** el driver oficial de `mongodb` para Node, sin Mongoose. Motivo: Mongoose tiene su propio sistema de esquemas/validación, y mantenerlo junto a Zod duplicaría la responsabilidad de validación en dos sitios (viola DRY, [02_Principios_Diseño.md](02_Principios_Diseño.md) §2). Zod es la única fuente de verdad de la forma de los datos.
- **Una colección por Aggregate Root** (ADR-03 §3.2): `usuarios`, `categorias`, `evaluaciones`, `recomendaciones`, `consentimientos`, `suscripciones`, `conexiones`.
- **Adaptador de infraestructura:** un `MongoXRepository` por entidad, implementando el puerto `XRepository` ya previsto en ADR-03/[02_Principios_Diseño.md](02_Principios_Diseño.md). Es el único código del proyecto con permiso para importar el driver de `mongodb`.
- **Entorno de desarrollo/test** (ADR-03 §3.4): un adaptador en memoria (un simple array/Map) implementando el mismo puerto, para no depender de Atlas durante el desarrollo diario ni en los tests — la base real de Atlas se usa en producción y, si hace falta, en tests de contrato puntuales.

## 6. Consecuencias

**Positivas:** coste cero de forma permanente y sin sorpresas; velocidad inmediata al usar una tecnología ya conocida; RF-34 resuelto sin fricción; el riesgo real del proyecto (aprender Clean Architecture) no se diluye compitiendo con un segundo aprendizaje simultáneo.

**A vigilar:** la disciplina de validar con Zod en cada frontera (escritura y lectura) no es opcional aquí — es lo único que sustituye la garantía de esquema que Postgres habría dado gratis. Bajo presión de fecha (RES-01), es el punto más fácil de saltarse y el más caro de descubrir roto más tarde.

---

## 7. Experimento futuro (si el calendario lo permite)

Si sobra tiempo tras el Ciclo 1, cambiar el adaptador de MongoDB a Supabase/Postgres es una forma de baja incertidumbre de practicar una tecnología nueva: gracias al patrón Repository (ADR-03), el cambio queda contenido en un adaptador nuevo — dominio y aplicación no se tocan. No es un compromiso, solo una opción abierta.

## 8. Próximo paso

Con arquitectura y almacenamiento decididos, ya no quedan bloqueos de diseño previos a empezar. Siguiente paso: las historias de usuario del Ciclo 1 (Nivel 2 Spec Anchored, [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)), empezando por el adaptador en memoria antes que la conexión real a Atlas.

---

## Historial de cambios

- **v1.0 (10 sept. 2026)** — versión inicial: se descartan Firestore (limitaciones de consulta reales para RF-34) y Supabase/Postgres (mejor encaje relacional, pero acumular una segunda incertidumbre tecnológica grande junto a Clean Architecture no compensa dado RES-01); se adopta MongoDB Atlas M0 por familiaridad del usuario y por ser gratuito de forma permanente. Carencias mitigadas explícitamente: Zod como sustituto de esquema forzado, auditoría vía caso de uso explícito, autorización en la capa de aplicación, cifrado de campos a nivel de aplicación.
