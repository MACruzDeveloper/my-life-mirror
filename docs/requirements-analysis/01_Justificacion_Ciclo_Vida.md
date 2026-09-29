# Justificación del Ciclo de Vida — Fase 2

**Basado en:** [01_Requisitos_Fase1.md](01_Requisitos_Fase1.md) v0.3, [02_Plan_Verificacion_Validacion.md](02_Plan_Verificacion_Validacion.md) v1.1
**Fecha:** 6 de septiembre de 2026

---

## 1. Modelos considerados y por qué no se eligen tal cual

| Modelo | Por qué no encaja tal cual aquí |
|---|---|
| **Cascada (Waterfall)** | Exige congelar requisitos antes de construir. Aquí hay al menos un requisito (RN-04, tono no punitivo) que **no se puede verificar sin construir y probar algo primero** — cascada no deja margen para ese aprendizaje. |
| **Scrum/ágil por sprints de tiempo fijo** | Válido, pero organiza el trabajo por calendario (sprints de 2 semanas), no explícitamente por **riesgo**. Aquí hay riesgos muy desiguales (privacidad de datos Art. 9 RGPD, límites éticos de RES-09, percepción de tono) que conviene resolver **antes** que funcionalidades de bajo riesgo como la gamificación. |
| **Espiral (Boehm), versión formal completa** | Es el que mejor casa conceptualmente (ver apartado 2), pero su versión de manual incluye un análisis de riesgo documentado y formal en cada ciclo, con estimaciones de coste — proceso pensado para equipos, no defendible en tiempo/coste para una persona con fecha límite fija (RES-01, RES-02). |

## 2. Por qué "espiral" es la idea correcta

El principio central del espiral —identificar el riesgo más alto no resuelto todavía y abordarlo en el siguiente ciclo, en vez de construir por orden de aparición en el documento— encaja con este proyecto por tres motivos concretos ya presentes en los requisitos:

1. **Hay riesgos legales/éticos reales y desiguales**: RES-04 (datos Art. 9 RGPD), RES-09 (límite ético del motor de recomendaciones), RES-11 (privacidad entre usuarios conectados). Dejarlos para el final sería construir primero lo fácil y arriesgar lo difícil justo antes de la entrega.
2. **Hay un riesgo de producto no verificable sin prototipo**: RN-04 (¿se percibe como motivador o como vigilancia?) solo se responde con un usuario real mirando la pantalla, no leyendo el requisito.
3. **Las prioridades MoSCoW ya están ordenadas por riesgo/valor de facto**: Must son exactamente los elementos sin los cuales el producto no demuestra su tesis (autoevaluación + recomendación + tono adecuado); Could son diferenciadores que no comprometen el proyecto si no llegan a tiempo.
4. **Motivo personal, más allá del riesgo del producto**: al ser un TFM de máster, quiero aplicar el máximo de lo aprendido durante el curso, lo que significa probar deliberadamente tecnologías y técnicas con las que tengo poca experiencia previa. Eso implica una **incertidumbre técnica alta** además de la incertidumbre de producto — y el espiral está pensado precisamente para eso: validar viabilidad técnica en ciclos cortos y baratos de deshacer, en vez de comprometerse a una arquitectura o herramienta a gran escala y descubrir un problema serio ya tarde en el calendario (RES-01).

## 3. Adaptación propuesta: espiral ligero, dirigido por riesgo y por MoSCoW

Cada ciclo sigue una versión reducida de las 4 fases del espiral clásico:

| Fase del espiral (Boehm) | Versión ligera aplicada aquí |
|---|---|
| 1. Fijar objetivos y alternativas | Seleccionar el siguiente bloque de RN/RF por prioridad MoSCoW y riesgo pendiente |
| 2. Analizar riesgo (+ prototipo si aplica) | Nombrar el riesgo principal del ciclo; si es un riesgo de percepción (RN-04) o legal (RES-04/09/11), resolverlo con prototipo antes de programar el resto |
| 3. Construir y verificar | Implementar + aplicar las técnicas de [02_Plan_Verificacion_Validacion.md](02_Plan_Verificacion_Validacion.md) correspondientes |
| 4. Revisar y planificar el siguiente ciclo | Demo con quien esté disponible (tutor si es posible, mi pareja si no) + decidir si el siguiente ciclo cambia de alcance |

Lo que se descarta deliberadamente del espiral formal, y por qué: el análisis de riesgo documentado por ciclo (una persona no necesita un documento de riesgo separado para decidir su propio siguiente paso) y la estimación de coste por ciclo (no hay presupuesto que gestionar, RES-03).

---

## 4. Ciclos propuestos

### Ciclo 0 — Planificación (en curso)
- **Contenido:** `01_Requisitos_Fase1.md`, matriz de trazabilidad, plan de V&V, este documento.
- **Riesgo que resuelve:** ambigüedad y falta de trazabilidad de los requisitos antes de escribir código.

### Ciclo 1 — MVP (núcleo Must + los Should que mitigan el mayor riesgo)
- **Alcance:** RF-01, RF-03, RF-04, RF-05 (cuenta/perfil/consentimiento) · RF-06, RF-07 (categorías) · RF-10 (check-in) · RF-14 (dashboard) · RF-18 (recomendación por umbral) · RF-23 (notificaciones básicas) · **RF-30** (líneas de crisis, adelantado aunque es Should porque mitiga el riesgo ético más alto desde el primer momento).
- **Riesgo principal a resolver:** RN-04 (tono) y RES-04 (cifrado/consentimiento de categorías sensibles) — ambos son mucho más caros de corregir si se dejan para después.
- **V&V aplicado:** tests unitarios sobre la lógica de umbral (RF-18), Given/When/Then + Playwright sobre los Must, usability test (n=1) centrado explícitamente en si el flujo se percibe punitivo.
- **Cierre de ciclo:** demo.

### Ciclo 2 — Should restante
- **Alcance:** RF-02, RF-08, RF-09, RF-11, RF-12, RF-13, RF-22 (resto de cuenta/check-in/notificaciones) · RF-15, RF-16, RF-31 (visualización y resumen mensual) · RF-26 (avatares) · RF-29 (apoyo profesional) · RF-27, RF-28 (localización, contenido ilustrativo per RES-10) · RF-40 (recomendaciones personalizadas con IA, ancladas al catálogo).
- **Riesgo principal:** RES-10 (contenido ficticio) — asegurar que quede explícito en la UI que ciertos datos son ilustrativos, para no inducir a error incluso en una demo académica.
- **V&V aplicado:** piloto corto con datos reales (RN-01/02/03), checklist manual sobre el resto de Should.

### Ciclo 3 — Could (solo si el calendario lo permite)
- **Alcance:** RF-17, RF-19, RF-20, RF-21 (motor de recomendaciones avanzado) · RF-24, RF-25 (gamificación) · RF-32, RF-33 (conexiones sociales, RD-11) · RN-11/RD-10 (premium, si se define contenido).
- **Riesgo principal:** RES-11 (no exponer puntuaciones entre usuarios) — el de mayor complejidad de diseño de todo el documento; por eso se deja para cuando el núcleo ya esté validado.

### Fuera de alcance del TFM (Won't / futuro)
RN-09 (comparativa social), app nativa (RES-06), contenido real (no ficticio) de comunidad/directorio profesional, motor de recomendaciones con personalización avanzada basada en IA más allá de RF-40 (texto generado sin anclaje al catálogo, o a partir de notas libres y categorías sensibles sin una evaluación previa), A/B testing con muestra real.

---

## 5. Próximo paso

Con los tres documentos de Fase 2 cerrados (matriz de trazabilidad, plan de V&V, ciclo de vida), el siguiente paso natural es el punto 5 de "Próximos pasos" en `01_Requisitos_Fase1.md`: derivar casos de uso / historias de usuario con criterios de aceptación para el Ciclo 1 (MVP), que es lo primero que hay que construir.

---

## Historial de cambios

- **v1.0 (6 sept. 2026)** — versión inicial: modelos considerados, justificación del espiral ligero dirigido por riesgo, definición de Ciclos 0-3 mapeados a MoSCoW.
- **v1.1 (6 sept. 2026)** — se añade motivo personal como cuarta justificación: incertidumbre técnica alta y deliberada por querer aplicar lo aprendido en el máster, no solo riesgo de producto.
- **v1.2 (8 sept. 2026)** — referencia cruzada a [10_Enfoque_SDD.md](10_Enfoque_SDD.md): el motivo de incertidumbre técnica de este punto 4 es también la razón por la que se descarta Nivel 1 (Spec First) como metodología de especificación del proyecto, en favor de Spec Anchored.
- **v1.1 (19 sept. 2026)** — nota: este documento descarta Scrum como modelo de ciclo de vida y sigue vigente (espiral ligero). Cómo fluye el trabajo dentro de cada ciclo se decide aparte, en [00_Metodologia_Lean.md](../project-management/00_Metodologia_Lean.md) (Lean + Kanban con apetito fijo, sin sprints).
- **v1.3 (27 sept. 2026)** — RF-40 entra en el Ciclo 2; la exclusión de "personalización avanzada basada en IA" se acota a lo que va más allá de RF-40.
