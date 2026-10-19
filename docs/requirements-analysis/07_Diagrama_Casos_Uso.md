# Diagrama de Casos de Uso

> **Análisis inicial (5-12 sept. 2026), no el diseño actual.** Es el modelo conceptual previo al código y se conserva como parte del proceso del TFM. Usa los nombres del análisis; en el código son: `Usuario` → `User` (módulo `accounts`), `Evaluacion` → `Assessment`, "check-in" → la entrevista (RF-10), `Recomendacion` → `Recommendation`, `Consentimiento` → `Consent`, `Categoria` → `Category`. `Conexion` y `Suscripcion` no están construidas (Ciclo 3 o posterior). El diseño real: [ADR-03](../architecture-decisions/03_Arquitectura_Software.md), las [historias de usuario](../user-stories/) y `src/modules/`.

**Diagrama:** [07_Diagrama_Casos_Uso.drawio](07_Diagrama_Casos_Uso.drawio) — ábrelo con la app de draw.io (desktop/web, "Abrir archivo") o la extensión "Draw.io Integration" de VS Code.
**Basado en:** [02_Requisitos_Fase1.md](02_Requisitos_Fase1.md)
**Fecha:** 7 de septiembre de 2026
**Formato:** draw.io (XML), el único diagrama del proyecto en este formato — el resto usa Mermaid (ver [05](05_Diagrama_Clases.md), [06](06_Diagrama_Secuencia_CheckIn.md)). Los use cases están consolidados a nivel de objetivo de usuario (no 1:1 con cada RF) porque esa es la granularidad correcta en UML — un caso de uso modela una meta del actor, no un botón de la interfaz. La trazabilidad completa a nivel de RF se mantiene en la tabla del apartado 2, no en el propio dibujo.

---

## 1. Actores

- **Usuario** — actor principal, cubre todas las metas del sistema.
- **Proveedor de Identidad Externo** (Google/Apple) — actor secundario, solo interviene en el login federado (RF-02).

## 2. Casos de uso y trazabilidad a RF

| Caso de uso | RF que cubre |
|---|---|
| Registrarse / Iniciar sesión | RF-01, RF-02 |
| Gestionar perfil y avatar | RF-03, RF-26 |
| Otorgar consentimiento para datos sensibles | RF-04 |
| Exportar / eliminar mis datos | RF-05 |
| Configurar categorías de vida | RF-06, RF-07, RF-08, RF-09 |
| Realizar autoevaluación (check-in) | RF-10, RF-11, RF-12, RF-13 |
| Consultar panel de estado general | RF-14, RF-15, RF-16, RF-17, RF-31 |
| Responder a recomendaciones | RF-18*, RF-19, RF-20, RF-21 |
| Configurar notificaciones | RF-22, RF-23 |
| Ver progreso y logros | RF-24, RF-25 |
| Configurar localización y ver comunidad | RF-27, RF-28 |
| Recibir apoyo y recursos de bienestar | RF-29, RF-30 |
| Gestionar conexiones con otros usuarios | RF-33 |
| Compartir/recibir recomendación entre iguales | RF-32 |

*RF-18 es lógica interna del sistema (genera la recomendación por umbral), no una acción del actor — se referencia aquí porque es la causa directa de que exista el caso de uso "Responder a recomendaciones", no porque el usuario lo "ejecute".

## 3. Relaciones especiales en el diagrama

- **`<<extend>>`**: "Otorgar consentimiento" extiende a "Configurar categorías de vida" — solo se dispara si la categoría que se activa es sensible (RF-04), no siempre. Por eso es `extend` y no `include` (que sería incondicional).
- **Nota UML** junto a "Responder a recomendaciones": recuerda RES-09 (nunca se emite un juicio o diagnóstico), en el mismo punto donde ya lo señalamos en el diagrama de secuencia.

## 4. Hallazgo — punto de disparo del consentimiento — ✅ resuelto

Se confirma la lectura literal de RF-04: el consentimiento se pide **al activar la categoría** (transición inactiva → activa), tanto en el onboarding (elección inicial de categorías al registrarse) como más tarde, si se activa una categoría sensible nueva desde la gestión de categorías (RF-07) — mismo modal en ambos casos.

El diagrama de secuencia del check-in se corrigió para quitar el paso de consentimiento (ya no le corresponde), y se creó [08_Diagrama_Secuencia_Consentimiento.md](08_Diagrama_Secuencia_Consentimiento.md) con el flujo correcto de activación + consentimiento condicional.

## 5. Cómo seguir editándolo

Este es el único diagrama que vive fuera de Markdown, así que el flujo de edición es distinto a los demás:
- Cambios de **contenido/estructura** (añadir un caso de uso, cambiar una relación): dímelo y edito el XML directamente, igual que cualquier otro archivo.
- Ajustes **puramente visuales** (mover cajas, reordenar para que quede menos apretado): mejor hazlo tú en la app de draw.io, ya que yo no puedo ver el resultado renderizado — el layout que he generado es una disposición en rejilla razonable, pero probablemente quieras reordenarlo a mano una vez lo abras.
