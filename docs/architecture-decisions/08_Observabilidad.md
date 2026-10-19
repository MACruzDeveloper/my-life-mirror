# ADR-08: Observabilidad

**Estado:** Aceptado
**Fecha:** 13 de septiembre de 2026
**Relacionado con:** [03_Arquitectura_Software.md](03_Arquitectura_Software.md) apartado 4, RNF-01, RNF-02, RNF-03, RNF-11

---

## 1. Contexto

[03_Arquitectura_Software.md](03_Arquitectura_Software.md) apartado 4 ya anticipaba esto: los SLO del proyecto existen desde la Fase 1 sin llamarse así (RNF-01 check-in <2 min, RNF-02 panel <2s, RNF-03 disponibilidad 99%) — falta medirlos. El disparador concreto fue un fallo real en producción (import con alias no resuelto en `api/`, ver [Historial_Prompts.md](../Historial_Prompts.md)) que costó varias idas y vueltas de diagnóstico por falta de logs estructurados.

## 2. Decisión: logging estructurado en JSON, sin SaaS externo

Un logger pequeño ([src/shared/infrastructure/logger.ts](../../src/shared/infrastructure/logger.ts)) que escribe cada línea como JSON (`timestamp`, `level`, `message`, campos de contexto como `route` o `userId`, error serializado con `message`/`stack`) a `console.log/warn/error`. El visor de logs de Vercel lo captura gratis y permite buscar/filtrar sobre esos campos — no hace falta Sentry/Datadog ni ningún SaaS de pago para el volumen de un piloto de TFM (RES-03, YAGNI).

**No confundir con la auditoría de RNF-11** (`RegistrarAuditoria`, [04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md) apartado 4): eso es un registro de negocio en la base de datos sobre accesos a datos de categoría especial; esto es observabilidad operativa para depurar el sistema. Son dos mecanismos distintos, no se sustituyen entre sí.

## 3. Alcance actual

Los dos endpoints de `api/` usan `logger.error` en su bloque catch. Se amplía a otros endpoints/casos de uso según se vayan construyendo — no se instala nada adicional (métricas, tracing) hasta que el proyecto lo pida de verdad.

## 4. Errores y rendimiento en el navegador: sin Sentry ni RUM externo (18 oct. 2026)

En la revisión de calidad tras la v1.4.0 se valoró añadir un servicio de errores y rendimiento con usuarios reales (Sentry, o la medición de Vercel, Speed Insights). **No se adopta por ahora**, por tres razones:

- **Datos de categoría especial.** Un informe de error del navegador lleva la URL, el recorrido previo y a veces el estado de la pantalla. Aquí eso puede incluir una categoría de salud o de sexualidad. Enviarlo a un tercero exige un encargado del tratamiento, ampliar la política de privacidad y filtrar cada evento. Es mucho riesgo para un piloto (RES-03).
- **Política de contenido.** Cada servicio externo amplía `connect-src` y `script-src` en `vercel.json` (AGENTS.md: "pensárselo antes").
- **Volumen.** Con un piloto de pocas personas no hay datos para que un panel de rendimiento real diga algo que no diga ya Lighthouse.

**Lo que cubre el hueco hoy:**

| Necesidad | Cómo se cubre |
|---|---|
| Errores del servidor | Logger JSON (apartado 2) en el visor de Vercel; las plantillas de controladores traducen cualquier excepción a un 500 y la registran |
| Una parte de la página que no carga | `LoadErrorBoundary`: se enseña un aviso en su lugar y el resto de la página sigue |
| Una pantalla entera que falla al pintarse | `AppErrorBoundary` en la raíz ([UX-14](../user-stories/UX-14-aviso-ante-errores.md)): "Algo ha fallado", con "Recargar" e "Ir al inicio", en lugar de una pantalla en blanco; el error queda en la consola |
| ¿Rompe algo la versión nueva? | *Smoke producción* tras cada despliegue, y el E2E con `api/` antes (04_Plan_Verificacion_Validacion.md, apartado 1.5) |
| Por qué falla un E2E | Traza, captura del fallo e informe HTML de Playwright, guardados como artefacto en GitHub Actions |
| Rendimiento | Lighthouse y la medición de CLS por elemento (04_Plan_Verificacion_Validacion.md, apartado 1.4) |

El límite de errores de toda la app, que la revisión encontró como hueco, se hizo el mismo día ([UX-14](../user-stories/UX-14-aviso-ante-errores.md)). **Cuándo revisar lo demás:** con usuarios reales fuera del piloto. Lo primero sería un RUM sin cookies ni datos de la persona (Speed Insights solo mide tiempos) y, para errores, un servicio con filtrado de URL y sin grabación de sesión.
