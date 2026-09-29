# ADR-08: Observabilidad

**Estado:** Aceptado
**Fecha:** 13 de septiembre de 2026
**Relacionado con:** [03_Arquitectura_Software.md](03_Arquitectura_Software.md) apartado 4, RNF-01, RNF-02, RNF-03, RNF-11

---

## 1. Contexto

[03_Arquitectura_Software.md](03_Arquitectura_Software.md) apartado 4 ya anticipaba esto: los SLO del proyecto existen desde la Fase 1 sin llamarse así (RNF-01 check-in <2 min, RNF-02 panel <2s, RNF-03 disponibilidad 99%) — falta medirlos. El disparador concreto fue un fallo real en producción (import con alias no resuelto en `api/`, ver [Historial_Prompts.md](../Historial_Prompts.md)) que costó varias idas y vueltas de diagnóstico por falta de logs estructurados.

## 2. Decisión: logging estructurado en JSON, sin SaaS externo

Un logger pequeño ([src/shared/infrastructure/logger.ts](../../src/shared/infrastructure/logger.ts)) que escribe cada línea como JSON (`timestamp`, `nivel`, `mensaje`, campos de contexto, error serializado con `mensaje`/`stack`) a `console.log/warn/error`. El visor de logs de Vercel lo captura gratis y permite buscar/filtrar sobre esos campos — no hace falta Sentry/Datadog ni ningún SaaS de pago para el volumen de un piloto de TFM (RES-03, YAGNI).

**No confundir con la auditoría de RNF-11** (`RegistrarAuditoria`, [04_Almacenamiento_Datos.md](04_Almacenamiento_Datos.md) apartado 4): eso es un registro de negocio en la base de datos sobre accesos a datos de categoría especial; esto es observabilidad operativa para depurar el sistema. Son dos mecanismos distintos, no se sustituyen entre sí.

## 3. Alcance actual

Los dos endpoints de `api/` usan `logger.error` en su bloque catch. Se amplía a otros endpoints/casos de uso según se vayan construyendo — no se instala nada adicional (métricas, tracing) hasta que el proyecto lo pida de verdad.

## 4. Próximo paso

Cuando existan más endpoints, añadir un id de correlación por petición (campo `requestId`) para poder seguir una petición a través de logs de distintas funciones — no se hace todavía porque solo hay un endpoint por flujo.

---

## Historial de cambios

- **v1.0 (13 sept. 2026)** — versión inicial: logger estructurado en JSON, sin SaaS externo, usado en los endpoints de `api/`.
- **v1.1 (20 sept. 2026)** — la auditoría de acciones de administración (ADM-03) va a una tabla de base de datos, no a estos logs: los logs de Vercel Hobby se conservan poco y no están protegidos contra modificación (OWASP A09). Aquí solo queda el aviso operativo `Acceso de administración denegado`.
