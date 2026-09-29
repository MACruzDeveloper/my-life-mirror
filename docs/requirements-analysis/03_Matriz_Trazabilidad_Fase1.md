# Matriz de Trazabilidad — Fase 2

**Basado en:** [02_Requisitos_Fase1.md](02_Requisitos_Fase1.md) v0.5
**Fecha:** 5 de septiembre de 2026 (actualizado tras cerrar Hallazgos 1 y 2)
**Objetivo:** verificar que cada Requisito de Negocio/Usuario (RN) esté cubierto por al menos un Requisito Funcional (RF), y dejar visible su relación con Requisitos No Funcionales (RNF), Restricciones (RES) y Requisitos de Datos (RD) relevantes.

---

## 1. Matriz RN → RF / RNF / RES / RD

| RN | RF relacionados | RNF relacionados | RES relacionados | RD relacionados | Cobertura |
|---|---|---|---|---|---|
| RN-01 | RF-06, RF-07, RF-09, RF-10 | RNF-01 | — | RD-01, RD-02, RD-03 | ✅ |
| RN-02 | RF-18, RF-19, RF-20, RF-21, RF-34, RF-35, RF-40 | — | — | RD-04, RD-09 | ✅ |
| RN-03 | RF-12, RF-16, RF-36 | — | — | RD-07 | ✅ |
| RN-04 | RF-19, RF-21 | — | RES-07, RES-09 | — | ✅ |
| RN-05 | RF-07, RF-08 | — | — | RD-02 | ✅ |
| RN-06 | RF-14, RF-17, RF-31 | — | — | — | ✅ (hallazgo 1 cerrado) |
| RN-07 | RF-24, RF-25 | — | — | — | ✅ |
| RN-08 | RF-32, RF-33, RF-37 | — | RES-11 | RD-11 | ✅ (hallazgo 2 cerrado) |
| RN-09 | *(ninguno — exclusión explícita)* | — | — | — | ✅ N/A (Won't v1; verificado que ningún RF implementa rankings/comparativa) |
| RN-10 | RF-29, RF-30 | — | RES-05, RES-09 | — | ✅ |
| RN-11 | *(pendiente — ver nota)* | — | — | RD-10 | ⚠️ Parcial (esperado, ver nota) |

**Leyenda:** ✅ cubierto · ⚠️ cobertura parcial / a decidir · ❌ sin cobertura (gap real)

---

## 2. Hallazgos de la verificación de consistencia (resueltos)

### Hallazgo 1 — RN-06 ("resumen del mes") — ✅ cerrado
Se añadió **RF-31**: resumen mensual (puntuación global + variación por categoría respecto al mes anterior), accesible desde el panel o por notificación.

### Hallazgo 2 — RN-08 ("compartir logros") — ✅ cerrado, con enfoque revisado
La propuesta inicial (tarjeta de logro exportable/compartible) se descartó por riesgo de fomentar una dinámica de "alarde" incompatible con RN-04 (tono no punitivo/no competitivo). Se sustituyó por un enfoque de **recomendación entre iguales, con doble consentimiento**:

- **RF-32**: cuando un usuario mejora significativamente en una categoría, el sistema puede sugerirle (nunca automáticamente) compartir su caso de éxito con una conexión que tenga puntuación baja sostenida en esa misma categoría. Requiere acción explícita del emisor + opt-in previo del receptor (reutilizando RF-23). Nunca expone puntuaciones exactas entre usuarios.
- **RF-33** (nuevo, prerrequisito): gestión de conexiones entre usuarios (solicitud/aceptación mutua).
- **RD-11** (nuevo): entidad `Conexión`.
- **RES-11** (nuevo): salvaguarda de privacidad — nunca exponer puntuaciones exactas ni datos brutos entre usuarios conectados.

Este enfoque encaja mejor con el posicionamiento del producto (RES-07, RES-08) que un compartir tipo red social pública.

---

## 3. Nota sobre requisitos transversales sin RN directo

En sentido inverso, hay RF/RNF que no cuelgan de ningún RN concreto — esto **no es un defecto**, son necesidades de soporte transversal que habilitan cualquier funcionalidad de negocio, no un objetivo de negocio en sí mismas:

- **RF-01 a RF-05, RF-26, RF-38, RF-39** (registro, login, perfil, consentimiento, exportación/borrado, avatar, recuperación de contraseña, landing) — infraestructura de cuenta necesaria para que cualquier RN funcione.
- **Todos los RNF** (rendimiento, seguridad, accesibilidad, etc.) — por definición son cualidades transversales del sistema, no atadas a un RN individual.
- **RF-27, RF-28** (localización/comunidad) — es un caso límite; podría justificarse retroactivamente bajo un RN nuevo ("apoyo a la integración del usuario") si quieres formalizarlo, o dejarse como funcionalidad de valor añadido sin RN propio. Lo dejo a tu criterio.

## 4. Nota sobre RN-11 (premium)
La cobertura parcial de RN-11 es esperada: ya documentamos en RN-11/RD-10 que las ventajas concretas del plan premium se definirán más adelante. No es un gap que haya que resolver ahora — se resolverá cuando decidáis el contenido del plan premium.

---
## Historial de cambios

- **v1.0 (5 sept. 2026)** — versión inicial, hallazgos 1 y 2 identificados y luego cerrados (ver apartado 2).
- **v1.1 (7 sept. 2026)** — se añade RF-34 (historial de recomendaciones) a la fila de RN-02, derivado de `09_Diagrama_Estados_Recomendacion.md`. Se corrige el enlace/versión de cabecera tras la renumeración de archivos.
- **v1.2 (10 sept. 2026)** — se añaden RF-35 (RN-02), RF-36 (RN-03) y RF-37 (RN-08), la nueva sección 2.11 de funcionalidades asistidas por IA. Ver [05_Fundamentos_IA.md](../architecture-decisions/05_Fundamentos_IA.md).
- **v1.3 (14 sept. 2026)** — se añaden RF-38 y RF-39 como infraestructura de cuenta transversal (apartado 3).
- **v1.4 (27 sept. 2026)** — RF-40 (recomendaciones personalizadas con IA) en la fila de RN-02.
- **v1.5 (29 sept. 2026)** — se elimina el apartado "Próximo paso": era una nota de la conversación de trabajo y lo pendiente vive en el [tablero](../project-management/01_Backlog_MVP.md).
