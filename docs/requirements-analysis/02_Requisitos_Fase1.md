# Especificación de Requisitos — Fase 1 (Visión General)
## Proyecto: "MyLifeMirror" (nombre provisional) — App de auto-evaluación y mejora de vida por categorías

**Versión:** 0.9
**Fecha:** Septiembre 2026 (última actualización: 5 de septiembre de 2026)
**Estado:** Borrador para validación con tutor/stakeholders — pendiente de Fase 2 (verificación, consistencia, trazabilidad)
**Fecha límite del proyecto (TFM):** 31 de octubre de 2026 — alcance incremental (MVP → fases adicionales según tiempo disponible).

---

## 0. Criterios de calidad aplicados

Cada requisito de este documento se ha redactado intentando cumplir:

| Criterio | Significado aplicado |
|---|---|
| **Claro** | Una sola interpretación posible, lenguaje no ambiguo |
| **Útil** | Aporta valor directo al objetivo del producto |
| **Necesario** | Su ausencia impide cumplir un objetivo de negocio o función clave |
| **Consistente** | No contradice a otro requisito del documento |
| **Verificable/Ascertainable** | Se puede comprobar objetivamente si se cumple o no (evitar "debe ser rápido" → "debe responder en <2s") |
| **Atómico** | Un requisito = una única necesidad (evitar "y" que oculte dos requisitos) |
| **Trazable** | Tiene un ID único para poder referenciarlo en diseño, pruebas y en la memoria del TFM |

Esquema de identificadores:
- `RN-xx` → Requisitos de Negocio / Usuario
- `RF-xx` → Requisitos Funcionales
- `RNF-xx` → Requisitos No Funcionales
- `RES-xx` → Restricciones
- `RD-xx` → Requisitos de Datos

Prioridad **MoSCoW**: Must / Should / Could / Won't (esta fase).

---

## 1. Requisitos de Negocio / Usuario (RN)

| ID | Descripción | Prioridad |
|---|---|---|
| RN-01 | El sistema debe permitir a un usuario individual evaluar periódicamente su vida dividida en categorías predefinidas (economía, vida social, amor/pareja, sexo, deporte, aventura, espiritualidad, familia, inversiones, etc.). | Must |
| RN-02 | El sistema debe generar, a partir de las puntuaciones bajas, recomendaciones de acciones concretas para mejorar cada categoría. | Must |
| RN-03 | El usuario debe poder ver la evolución histórica de sus puntuaciones a lo largo del tiempo. | Must |
| RN-04 | El producto debe transmitir una experiencia motivadora y no punitiva (evitar el efecto "vigilancia/ansiedad" tipo *Black Mirror*: el sistema aconseja, no juzga ni penaliza). | Must |
| RN-05 | El usuario debe poder personalizar qué categorías quiere trackear y cuáles ocultar/desactivar. | Should |
| RN-06 | El sistema debe poder ofrecer una visión rápida tipo "resumen del mes" del estado general de vida. | Should |
| RN-07 | El producto podrá incorporar mecánicas de gamificación (rachas, logros, niveles al estilo Los Sims) para fomentar el uso continuado. | Could |
| RN-08 | El sistema podrá permitir a un usuario compartir, de forma puntual y con consentimiento explícito de ambas partes, un caso de éxito propio con otro usuario conectado que tenga dificultades en la misma categoría, como motivación entre iguales (no como comparación pública ni alarde en redes sociales). | Could |
| RN-09 | El producto no ofrecerá, en esta primera versión, comparativa social directa entre usuarios (rankings, competición entre perfiles). | Won't (v1) |
| RN-10 | El sistema no sustituirá asesoramiento profesional (financiero, médico, psicológico, sexológico); actuará como apoyo motivacional, no clínico. | Must |
| RN-11 | El sistema podrá ofrecer un nivel de cuenta premium; el conjunto de ventajas asociadas se definirá en una fase posterior. | Could |

---

## 2. Requisitos Funcionales (RF)

### 2.1 Gestión de cuenta y perfil
| ID | Descripción | Prioridad |
|---|---|---|
| RF-01 | El sistema debe permitir registrar una cuenta mediante email y contraseña. | Must |
| RF-02 | El sistema debe permitir iniciar sesión mediante proveedores externos (Google/Apple) además de email/contraseña. | Should |
| RF-03 | El sistema debe permitir al usuario configurar su perfil (nombre, edad, género opcional, zona horaria). | Must |
| RF-04 | El sistema debe solicitar consentimiento explícito y granular antes de activar categorías sensibles (sexo, espiritualidad/religión, salud/deporte). | Must |
| RF-05 | El sistema debe permitir al usuario exportar y eliminar completamente sus datos ("derecho al olvido"). | Must |
| RF-26 | El sistema debe ofrecer al usuario, durante el registro, un catálogo cerrado de avatares predefinidos generados con IA y revisados editorialmente por el equipo (el usuario elige entre las opciones existentes, no genera avatares nuevos), evitando estereotipos culturales, de género o de apariencia. Relacionado con RF-25. | Should |
| RF-38 | El sistema debe permitir a un usuario recuperar el acceso a su cuenta mediante un enlace de restablecimiento de contraseña enviado a su email, sin necesidad de contactar con soporte. | Should |
| RF-39 | El sistema debe mostrar una página de inicio (landing) pública con una introducción al proyecto, accesible sin necesidad de autenticarse. | Should |

### 2.2 Configuración de categorías de vida
| ID | Descripción | Prioridad |
|---|---|---|
| RF-06 | El sistema debe ofrecer un catálogo inicial de categorías predefinidas (mínimo: economía, vida social, pareja, sexo, deporte, aventura, espiritualidad, familia, inversiones). | Must |
| RF-07 | El usuario debe poder activar/desactivar categorías individualmente. | Must |
| RF-08 | El usuario debe poder crear categorías personalizadas adicionales. | Could |
| RF-09 | El sistema debe permitir configurar la frecuencia de evaluación por categoría (semanal, mensual). | Should |

### 2.3 Autoevaluación / Check-in
| ID | Descripción | Prioridad |
|---|---|---|
| RF-10 | El sistema debe permitir al usuario puntuar cada categoría activa en una escala definida (p. ej. 1–10) en cada periodo de evaluación. | Must |
| RF-11 | El sistema debe permitir añadir una nota o comentario libre asociado a cada puntuación. | Should |
| RF-12 | El sistema debe guardar cada evaluación con marca de tiempo, de forma inmutable (no editable retroactivamente, salvo corrección en las siguientes 24h). | Should |
| RF-13 | El sistema debe recordar al usuario (notificación) cuándo toca una nueva evaluación según la frecuencia configurada. | Should |

### 2.4 Panel / Dashboard
| ID | Descripción | Prioridad |
|---|---|---|
| RF-14 | El sistema debe mostrar un panel general con la puntuación actual de cada categoría activa. | Must |
| RF-15 | El sistema debe representar visualmente (gráfico tipo radar o similar) el equilibrio entre categorías. | Should |
| RF-16 | El sistema debe mostrar la evolución temporal (gráfico de líneas) de cada categoría. | Should |
| RF-17 | El sistema debe calcular y mostrar una "puntuación global de vida" ponderada a partir de las categorías activas. | Could |
| RF-31 | El sistema debe generar mensualmente un resumen del estado general de vida (puntuación global y variación respecto al mes anterior por categoría), accesible desde el panel o enviado como notificación. | Should |

### 2.5 Motor de recomendaciones
| ID | Descripción | Prioridad |
|---|---|---|
| RF-18 | El sistema debe proponer al menos una recomendación de acción concreta cuando una categoría puntúe por debajo de un umbral configurable. | Must |
| RF-19 | El sistema debe permitir al usuario marcar una recomendación como "hecha", "descartada" o "pospuesta". | Should |
| RF-20 | El sistema debe adaptar las recomendaciones futuras en función de qué recomendaciones ha aceptado o descartado el usuario previamente (personalización básica). | Could |
| RF-21 | El sistema debe permitir al usuario pedir una recomendación alternativa si la propuesta no le convence. | Could |
| RF-34 | El sistema debe permitir al usuario consultar el historial completo de sus recomendaciones (en cualquier estado: pendiente de respuesta, hecha, descartada, pospuesta), con filtros por estado, categoría y rango de fechas. | Should |

### 2.6 Notificaciones
| ID | Descripción | Prioridad |
|---|---|---|
| RF-22 | El sistema debe enviar notificaciones push/email para recordatorios de evaluación y recomendaciones pendientes. | Should |
| RF-23 | El usuario debe poder configurar o desactivar cada tipo de notificación de forma independiente. | Must |

### 2.7 Gamificación (opcional, fase futura)
| ID | Descripción | Prioridad |
|---|---|---|
| RF-24 | El sistema podrá otorgar insignias/logros por constancia (rachas de evaluación, mejoras sostenidas). | Could |
| RF-25 | El sistema podrá mostrar un "avatar" o representación visual que refleje el estado global de vida del usuario (inspirado en Los Sims). | Could |

### 2.8 Localización y comunidad
| ID | Descripción | Prioridad |
|---|---|---|
| RF-27 | El sistema debe permitir al usuario indicar, de forma opcional, su país de origen y su país de residencia actual (selector o mapa). | Should |
| RF-28 | El sistema podrá, a partir del par país de origen/residencia, mostrar sugerencias de comunidad y ayudas (eventos, recursos gubernamentales, contacto consular) de forma no prescriptiva y sin generar prejuicios. Dado el alcance del TFM (ver RES-10), el contenido podrá ser de ejemplo (ficticio/ilustrativo) y cubrir solo un subconjunto reducido de países, priorizando la demostración del concepto. | Could |

### 2.9 Apoyo profesional y bienestar
| ID | Descripción | Prioridad |
|---|---|---|
| RF-29 | Si un usuario mantiene puntuaciones bajas sostenidas en una categoría (umbral configurable) y descarta repetidamente las recomendaciones asociadas, el sistema podrá sugerir, de forma no directiva, recursos de apoyo profesional (p. ej. directorio de psicólogos/terapeutas) relacionados con esa categoría, junto con el disclaimer de RES-05. Dado el alcance del TFM, el directorio podrá contener entradas de ejemplo (ver RES-10). | Could |
| RF-30 | El sistema debe mostrar de forma permanente y accesible (p. ej. en ajustes/ayuda), con independencia de la actividad o puntuaciones del usuario, información real y verificada de líneas de ayuda en crisis relevantes para su región. Estos datos no son ficticios ni de ejemplo (ver RES-10). | Should |

### 2.10 Conexiones sociales y recomendaciones entre usuarios
| ID | Descripción | Prioridad |
|---|---|---|
| RF-32 | Cuando un usuario mejora significativamente su puntuación en una categoría, el sistema podrá sugerirle —nunca de forma automática— compartir su caso de éxito como recomendación motivacional con un usuario conectado (RF-33) que tenga una puntuación baja sostenida en esa misma categoría. El envío requiere una acción explícita del usuario emisor, y solo llega a usuarios receptores que hayan activado previamente, en sus ajustes de notificación (RF-23), la opción de recibir este tipo de recomendaciones de sus conexiones. El sistema no debe revelar la puntuación exacta de ningún usuario al otro; únicamente el hecho de la mejora y el mensaje que el emisor decida compartir (ver RES-11). | Could |
| RF-33 | El sistema debe permitir a un usuario enviar y aceptar solicitudes de conexión con otros usuarios (relación mutuamente confirmada por ambas partes), como prerrequisito de las funciones sociales opcionales (RF-32). | Should |

### 2.11 Funcionalidades asistidas por IA
| ID | Descripción | Prioridad |
|---|---|---|
| RF-35 | Al marcar una recomendación como "hecha" (RF-19), el sistema podrá permitir al usuario dejar opcionalmente un comentario reflexivo sobre la experiencia, en texto libre o dictado por voz mediante reconocimiento de voz. | Could |
| RF-36 | El sistema podrá ofrecer una función de consulta en lenguaje natural sobre el propio historial de evaluaciones y recomendaciones del usuario (p. ej. "¿cómo ha evolucionado mi categoría deporte este trimestre?"), respondida mediante recuperación de los datos del propio usuario (RAG) y nunca datos de otros usuarios. | Could |
| RF-37 | Al redactar el mensaje de RF-32, el sistema podrá ofrecer ayuda de redacción asistida por IA sobre el borrador del usuario, verificando mediante razonamiento explícito que el texto final no contenga lenguaje diagnóstico (RES-09) ni tono de alarde, antes de mostrarlo al usuario emisor para su aprobación final. | Could |
| RF-40 | El sistema podrá personalizar con IA la redacción de una recomendación (RF-18): el modelo elige entre las ideas del catálogo curado para esa categoría y la reescribe según la puntuación y su tendencia, con salida estructurada. Antes de mostrarla, una verificación automática (lista de términos + segunda pasada del modelo) descarta lenguaje diagnóstico (RES-09), consejo profesional (RES-05) y tono de juicio (RN-04); si la verificación falla o el proveedor no responde, se muestra el texto del catálogo. Solo con consentimiento explícito del usuario (desactivado por defecto), marcada como "personalizada con IA" y con el aviso de RES-05. Primera versión: sin notas de texto libre ni categorías sensibles. Sin moderación humana: el usuario nunca espera a nadie. | Should |

---

## 3. Requisitos No Funcionales (RNF)

| ID | Categoría | Descripción | Prioridad |
|---|---|---|---|
| RNF-01 | Usabilidad | La evaluación semanal/mensual de todas las categorías activas debe poder completarse en menos de 2 minutos. | Must |
| RNF-02 | Rendimiento | El dashboard principal debe cargar en menos de 2 segundos con conexión estándar (4G/wifi). | Should |
| RNF-03 | Disponibilidad | El sistema debe tener una disponibilidad objetivo del 99% (fuera de ventanas de mantenimiento planificado). | Should |
| RNF-04 | Seguridad | Todos los datos sensibles (categoría 9 RGPD: sexo, salud, religión) deben almacenarse cifrados en reposo y en tránsito (TLS 1.2+, AES-256). | Must |
| RNF-05 | Privacidad | El sistema debe cumplir el RGPD, incluyendo base legal de consentimiento explícito para datos de categoría especial. | Must |
| RNF-06 | Compatibilidad | La interfaz debe ser responsive y funcionar correctamente en los navegadores principales (Chrome, Safari, Firefox), diseñada mobile-first y adaptada explícitamente a móvil, tablet y escritorio (no solo un contenedor que se ensancha). | Must |
| RNF-07 | Escalabilidad | La arquitectura debe soportar un crecimiento de usuarios sin rediseño mayor (al menos hasta un orden de magnitud sobre el volumen inicial estimado). | Could |
| RNF-08 | Mantenibilidad | El código debe seguir una arquitectura modular que permita añadir nuevas categorías sin modificar el core del sistema. | Should |
| RNF-09 | Accesibilidad | La interfaz debe cumplir como mínimo el nivel AA de WCAG 2.1 en las pantallas principales. | Could |
| RNF-10 | Internacionalización | El sistema debe soportar como mínimo español e inglés desde el lanzamiento. | Could |
| RNF-11 | Auditabilidad | El sistema debe registrar (log) los accesos y modificaciones a datos sensibles con fines de auditoría de seguridad. | Should |
| RNF-12 | Portabilidad de datos | El usuario debe poder exportar sus datos en un formato estructurado y legible (JSON/CSV). | Should |
| RNF-13 | Control de acceso | El sistema debe soportar roles de usuario (estándar, premium, administrador) que diferencien permisos y funcionalidad disponible. El rol de administrador es de uso interno del equipo, no autoasignable; el rol premium es la base de RN-11 (sus ventajas concretas se definen en una fase posterior). | Should |

---

## 4. Restricciones (RES)

| ID | Tipo | Descripción |
|---|---|---|
| RES-01 | Tiempo | El desarrollo debe ajustarse al calendario académico del TFM: fecha límite el 31 de octubre de 2026 (no negociable). El alcance se abordará de forma incremental, desde un MVP hasta las fases adicionales que el tiempo permita. |
| RES-02 | Equipo | Desarrollo por una única persona (o equipo reducido), lo que limita el alcance funcional realista para v1. |
| RES-03 | Presupuesto | Sin presupuesto para infraestructura de pago significativa; se priorizarán servicios con capa gratuita (Firebase, Supabase, Vercel, etc.) o self-hosted. |
| RES-04 | Legal | Las categorías "sexo", "espiritualidad/religión" y aspectos de salud (deporte) constituyen datos de categoría especial bajo el Art. 9 RGPD → requieren consentimiento explícito diferenciado y medidas de seguridad reforzadas. |
| RES-05 | Legal | El sistema no debe emitir recomendaciones que puedan interpretarse como asesoramiento médico, financiero o psicológico profesional (disclaimer obligatorio). |
| RES-06 | Técnica | La v1 no incluirá app nativa iOS/Android; se optará por web responsive / PWA por limitación de tiempo. |
| RES-07 | Ética | El motor de recomendaciones no debe inducir comportamientos compulsivos ni ansiedad (evitar patrones de "dark pattern" tipo notificaciones culpabilizadoras — referencia explícita a la crítica que hace *Black Mirror* a este tipo de sistemas). |
| RES-08 | Datos | No se debe compartir ni vender datos de usuario a terceros bajo ningún concepto (posicionamiento de producto, no solo obligación legal). |
| RES-09 | Ética | El sistema no implementará detección algorítmica de riesgo de autolesión o depresión clínica. Cualquier sugerencia de ayuda profesional (RF-29) se basará únicamente en umbrales de comportamiento objetivos y visibles para el usuario (puntuación sostenida y rechazo de recomendaciones), nunca en una afirmación diagnóstica. |
| RES-10 | Alcance | Dado el carácter académico del proyecto (TFM, fecha límite RES-01) y el equipo reducido (RES-02), el contenido de localización/comunidad (RF-28) y de directorio profesional (RF-29) podrá ser ilustrativo o ficticio, y cubrir solo un subconjunto reducido de casos, priorizando la demostración del concepto sobre la cobertura real. Se exceptúan expresamente los recursos de ayuda en crisis (RF-30), que deben ser siempre reales y verificados, sin excepción. |
| RES-11 | Privacidad | Las funciones sociales entre usuarios conectados (RF-32) no deben exponer puntuaciones exactas ni datos brutos de un usuario a otro; el sistema solo puede comunicar información que el usuario emisor decida explícitamente compartir en cada caso. |

---

## 5. Requisitos de Datos (RD)

| ID | Descripción | Prioridad |
|---|---|---|
| RD-01 | El sistema debe modelar una entidad `Usuario` con datos de identificación y preferencias de cuenta. | Must |
| RD-02 | El sistema debe modelar una entidad `Categoría` con: nombre, descripción, tipo (estándar/personalizada), estado (activa/inactiva), es_dato_sensible (booleano). | Must |
| RD-03 | El sistema debe modelar una entidad `Evaluación` (check-in) con: usuario, categoría, puntuación, fecha, nota opcional. | Must |
| RD-04 | El sistema debe modelar una entidad `Recomendación` con: usuario destinatario, categoría asociada, texto, condición de disparo (umbral), estado (pendiente de respuesta / hecha / descartada / pospuesta). Cada recomendación queda registrada como propuesta a un usuario concreto, con el estado de su respuesta. | Must |
| RD-05 | El sistema debe modelar un registro de `Consent` por usuario y por categoría sensible, con fecha y versión de política aceptada. | Must |
| RD-06 | Los datos de categorías sensibles (sexo, espiritualidad, salud) deben estar lógicamente separados/etiquetados para poder aplicarles cifrado y controles de acceso diferenciados. | Must |
| RD-07 | El sistema debe conservar el histórico de evaluaciones sin sobrescritura, para permitir análisis de evolución temporal. | Should |
| RD-08 | El sistema debe poder anonimizar o pseudonimizar datos de usuario en caso de eliminación de cuenta, si existen registros necesarios por obligación legal (p. ej. facturación). | Could |
| RD-09 | El catálogo de recomendaciones debe poder gestionarse como contenido versionable (para poder ampliarlo sin tocar código). | Could |
| RD-10 | El sistema debe modelar una entidad `Suscripción` (usuario, tipo de plan, estado, fecha de inicio/fin) para soportar el nivel premium (RN-11); el detalle de ventajas por plan se definirá en una fase posterior. | Could |
| RD-11 | El sistema debe modelar una entidad `Conexión` (usuario_a, usuario_b, estado: pendiente/aceptada/rechazada, fecha) para representar relaciones confirmadas mutuamente entre usuarios, necesarias para RF-32/RF-33. | Should |

---
## Historial de cambios

- **v0.1 (baseline, sept. 2026)** — versión inicial: RN-01 a RN-10, RF-01 a RF-25, RNF-01 a RNF-12, RES-01 a RES-08, RD-01 a RD-09.
- **v0.2 (5 sept. 2026)** — primera ronda de comentarios de revisión: RN-11 (premium, RD-10), RF-26 (catálogo de avatares con IA), sección 2.8 Localización y comunidad (RF-27, RF-28), sección 2.9 Apoyo profesional y bienestar (RF-29, RF-30), RES-09 (sin detección algorítmica de riesgo) y RES-10 (alcance de contenido ilustrativo/ficticio para el TFM), fecha límite explícita (31 oct. 2026) en RES-01.
- **v0.3 (5 sept. 2026)** — cierre de hallazgos de la matriz de trazabilidad ([03_Matriz_Trazabilidad_Fase1.md](03_Matriz_Trazabilidad_Fase1.md)): RF-31 (resumen mensual, cierra RN-06); RN-08 reescrito y sección 2.10 Conexiones sociales y recomendaciones entre usuarios (RF-32 recomendación entre iguales con doble consentimiento, RF-33 conexiones), RES-11 (salvaguarda de privacidad entre usuarios), RD-11 (entidad `Conexión`).
- **v0.4 (7 sept. 2026)** — cierre de hallazgos del diagrama de clases ([05_Diagrama_Clases.md](05_Diagrama_Clases.md)): RD-04 ahora incluye explícitamente el usuario destinatario, y el estado pasa a `pendiente de respuesta / hecha / descartada / pospuesta`, alineado con RF-19.
- **v0.5 (7 sept. 2026)** — RF-34 (historial de recomendaciones con filtros por estado/categoría/fecha), derivado del diagrama de estados ([09_Diagrama_Estados_Recomendacion.md](09_Diagrama_Estados_Recomendacion.md)).
- **v0.6 (10 sept. 2026)** — nueva sección 2.11 Funcionalidades asistidas por IA: RF-35 (comentario reflexivo por voz al completar una recomendación), RF-36 (consulta en lenguaje natural sobre el propio historial, vía RAG), RF-37 (asistente de redacción del mensaje de RF-32 con verificación explícita anti-diagnóstico/anti-alarde). Ver [05_Fundamentos_IA.md](../architecture-decisions/05_Fundamentos_IA.md) para la justificación técnica.
- **v0.7 (14 sept. 2026)** — RF-38 (recuperación de contraseña) y RF-39 (landing pública), ambas extensión de RF-01/Sprint 1.
- **v0.8 (14 sept. 2026)** — RNF-13 (control de acceso por roles: estándar/premium/administrador), preparación de RN-11 y de un futuro rol de administrador para el equipo. Se corrige el campo "Versión" de este documento, desactualizado desde v0.3.
- **v0.9 (14 sept. 2026)** — RNF-06 explicita mobile-first con adaptación real a tablet ([07_UI.md](../architecture-decisions/07_UI.md) apartado 6), no solo "responsive" en abstracto.
- **v0.10 (27 sept. 2026)** — RF-40 (recomendaciones personalizadas con IA, ancladas al catálogo curado y con verificación automática), Should, Ciclo 2. Surge de la validación (la participante pidió sugerencias más personales) y lo confirma el autor. Ver [05_Fundamentos_IA.md](../architecture-decisions/05_Fundamentos_IA.md) apartado 4.3.
- **v0.11 (29 sept. 2026)** — se elimina el apartado "Próximo paso": era una nota de la conversación de trabajo y lo pendiente vive en el [tablero](../project-management/01_Backlog_MVP.md).
