# Historial de Prompts y Decisiones — Proyecto LifeScore

Registro cronológico de los prompts/instrucciones más relevantes recibidos durante el desarrollo del TFM, junto con la decisión o artefacto que generaron. No es una transcripción completa de la conversación — solo los puntos que cambiaron el rumbo del proyecto o fijaron una decisión de diseño/proceso.

---

**5 sept. 2026** — *"Could we join it with this project I have open in VSCode? So we can keep the memory..."*
→ Se aclara que este repo (Claude Code) y el Project de claude.ai son entornos distintos sin sincronización automática. Se establece este repo como fuente de verdad. Convención fijada: chat en inglés, documentos `.md` entregables en español.

**5 sept. 2026** — Comentarios sobre `01_Requisitos_Fase1.md` (primera ronda):
1. Añadir cuenta premium (ventajas a definir más adelante).
2. Avatares de registro generados con IA, pero como catálogo cerrado elegible por el usuario (no generación en vivo), evitando estereotipos.
3. Mapa de país de origen/residencia para sugerir comunidad/ayudas localizadas, con cuidado de no generar prejuicios.
4. Recomendar ayuda profesional cuando el usuario rechaza recomendaciones y mantiene puntuación baja — con la pregunta explícita de qué hacer ante señales de riesgo (depresión/autolesión).
→ Resultado: v0.2 del documento de requisitos (RN-11, RF-26, secciones 2.8/2.9, RES-09/RES-10, RD-10). Decisión clave: **no** se implementa detección algorítmica de riesgo clínico (RES-09); solo umbrales de comportamiento visibles + recursos de crisis siempre reales (RF-30).

**5 sept. 2026** — *"I don't see the file updated... I created a repo in GitHub... Regarding RES-09 I can't ask the tutor, just leave it for now."*
→ Se confirma que el archivo sí estaba actualizado localmente; el repo de GitHub estaba vacío por falta de commits (nada se había subido aún). RES-09 queda marcado como pendiente de validar con el tutor, sin fecha.

**5 sept. 2026** — Preguntas conceptuales: qué es una matriz de trazabilidad, cómo aplicar técnicas de V&V a escala de TFM, si el ciclo de vida en espiral encaja con el proyecto.
→ Se acuerda producir tres documentos, uno por uno, dentro de `docs/requirements-analysis/`: (1) matriz de trazabilidad, (2) plan de V&V, (3) justificación del ciclo de vida.

**5 sept. 2026** — Matriz de trazabilidad: revisión y confirmación, con una corrección sobre RF-32 — *"Instead of creating a card... I would adapt it to recommendations... send a recommendation showing his success case... with the confirmation of both users."*
→ RF-32 rediseñado como recomendación entre iguales con doble consentimiento (opt-in del receptor + acción explícita del emisor), nunca exponiendo puntuaciones exactas. Se añaden RF-33 (conexiones), RD-11 (`Conexión`), RES-11 (salvaguarda de privacidad). v0.3 del documento de requisitos.

**6 sept. 2026** — Comentarios sobre el Plan de V&V:
- Sin acceso a tutor/compañeros por ahora para peer review o demos → punto en espera.
- Mi pareja es la persona disponible para dar opinión de usuario cuando se necesite.
- Sí automatizar con Playwright, al menos para los requisitos Must.
- Petición de proceso: mantener el plan inicial de cada documento y añadir una sección de actualizaciones (en vez de sobrescribir en silencio), simulando trabajo en equipo. Petición de este mismo archivo de historial de prompts.
→ v1.1 del Plan de V&V (ajustes de disponibilidad + Playwright para Must). Se adopta la convención de sección **"Historial de cambios"** al final de cada documento de aquí en adelante. Se crea este archivo.

**6 sept. 2026** — *"ok got it. Let's continue with the file 3"*
→ Se crea [03_Justificacion_Ciclo_Vida.md](requirements-analysis/03_Justificacion_Ciclo_Vida.md): se descarta cascada y espiral formal completa, se adopta un espiral ligero dirigido por riesgo/MoSCoW, con Ciclo 0 (planificación, en curso), Ciclo 1 (MVP Must + RF-30 adelantado por riesgo ético), Ciclo 2 (Should), Ciclo 3 (Could, condicional al calendario).

**6 sept. 2026** — *"apart of the risks the main reason is because I'm working in a master project where I want to apply the most I have learned, so the technical uncertainty is very big"*
→ Se añade a la justificación del ciclo de vida un cuarto motivo, personal: incertidumbre técnica alta y deliberada (querer aplicar lo máximo aprendido en el máster), no solo riesgo del producto.

**7 sept. 2026** — *"before continuing... I should work on some UML diagram. Draw.io or mermaid?... they need to be dynamic and easy to modify in next phases"*
→ Se decide un enfoque híbrido: Mermaid (texto, versionable, iteración rápida conmigo) para clases/secuencia/estado; draw.io reservado para el diagrama de casos de uso si hace falta notación UML completa. Se crea [05_Diagrama_Clases.md](requirements-analysis/05_Diagrama_Clases.md) a partir de RD-01 a RD-11. El propio ejercicio de diagramar saca dos hallazgos: falta el campo `usuario` en RD-04 (`Recomendación`), e inconsistencia de estados entre RD-04 y RF-19 (falta "pospuesta"). Pendientes de resolución.

**7 sept. 2026** — *"Yes we should add a relationship between recommendations and users and its state... pending, done, refused, postponed. You can start with the sequence diagram so I can test it in my GitHub"*
→ Se resuelven los dos hallazgos del diagrama de clases: RD-04 incluye ahora usuario destinatario y estados `pendiente de respuesta/hecha/descartada/pospuesta` (v0.4 de requisitos, v1.1 del diagrama de clases). Se crea [06_Diagrama_Secuencia_CheckIn.md](requirements-analysis/06_Diagrama_Secuencia_CheckIn.md) con el flujo completo de check-in en Mermaid, para probar el render nativo de GitHub.

---

*Este archivo se actualiza cada vez que un prompt fija una decisión de diseño, proceso o alcance — no en cada mensaje.*
