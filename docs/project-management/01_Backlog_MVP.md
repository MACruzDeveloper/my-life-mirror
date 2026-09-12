# Backlog del MVP (Ciclo 1) — Sprints Semanales

**Fecha:** 12 de septiembre de 2026
**Relacionado con:** [01_Justificacion_Ciclo_Vida.md](../requirements-analysis/01_Justificacion_Ciclo_Vida.md) (alcance del Ciclo 1), [03_Arquitectura_Software.md](../architecture-decisions/03_Arquitectura_Software.md), [04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md), [10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md)
**Plazo:** 31 de octubre de 2026 (RES-01) — 7 semanas desde hoy.
**Capacidad asumida:** 10-12h/semana como base, con margen al alza (más disponibilidad esperada más adelante, días libres en octubre). Los sprints están dimensionados a la base conservadora; el tiempo extra es colchón, no se reparte de antemano.

Cada tarea se especifica primero como historia de usuario Nivel 2 (Spec Anchored) antes de implementarse, y se descompone en las capas de Clean Architecture (dominio → aplicación → infraestructura), empezando siempre por el adaptador en memoria antes que MongoDB Atlas.

---

## Sprint 0 — Cimientos (dentro de la semana 1, 12-18 sept.)

Trabajo transversal que no pertenece a ningún RF pero bloquea a todos:

- [ ] Estructura de carpetas mínima por módulo (`domain/`, `application/`, `infrastructure/`) — ADR-03 §3.5.
- [ ] Configurar Vitest, Zod y alias de módulo en `tsconfig.json`.
- [ ] Composition Root inicial (`container.ts`) con entorno `dev` → adaptadores en memoria.
- [ ] Crear un **nuevo Project en MongoDB Atlas** (independiente del existente) + clúster M0 para MyLifeMirror.
- [ ] **RF-30** (líneas de ayuda en crisis): sin lógica de dominio, contenido estático — se adelanta aquí por ser barato y de máxima prioridad ética (mismo razonamiento que en el Ciclo 1 original).

## Sprint 1 (19-25 sept.) — Cuentas y consentimiento

Todo lo demás depende de que una cuenta exista y de que el consentimiento esté resuelto antes de activar categorías sensibles (RF-04).

- [ ] **RF-01** — Entidad `Usuario`; casos de uso `RegistrarUsuario`, `IniciarSesion`; adaptador en memoria.
- [ ] **RF-04** — Entidad `Consentimiento`; caso de uso `OtorgarConsentimiento`, disparado como extensión al activar una categoría sensible (ver [08_Diagrama_Secuencia_Consentimiento.md](../requirements-analysis/08_Diagrama_Secuencia_Consentimiento.md)).
- [ ] Tests de dominio de ambos.

## Sprint 2 (26 sept.-2 oct.) — Perfil y categorías

- [ ] **RF-03** — Caso de uso `ConfigurarPerfil`.
- [ ] **RF-06 / RF-07** — Entidad `Categoría`; casos de uso `ActivarCategoria`/`DesactivarCategoria` (con la extensión a RF-04 cuando la categoría es sensible).
- [ ] **RF-05** — Caso de uso `ExportarYEliminarDatos` (Must, pero no bloquea nada posterior — si el sprint se aprieta, es la primera candidata a moverse al buffer).

## Sprint 3 (3-9 oct.) — Check-in

- [ ] **RF-10** — Value Object `Puntuacion` (valida rango 1-10 en construcción), Aggregate Root `Evaluación`; caso de uso `RegistrarEvaluacion`.
- [ ] Tests de dominio del VO y del aggregate.

## Sprint 4 (10-16 oct.) — Recomendaciones y panel

- [ ] **RF-18** — Entidad `Recomendación`; caso de uso `EvaluarUmbralYGenerarRecomendacion` (dispara sobre el evento de `RegistrarEvaluacion`, ver Outbox en ADR-03 §3.4).
- [ ] **RF-14** — Caso de uso de solo lectura `ConsultarPanelGeneral`, componiendo datos de Evaluaciones + Recomendaciones.

## Sprint 5 (17-23 oct.) — Notificaciones + persistencia real

- [ ] **RF-23** — Caso de uso `ConfigurarNotificaciones`.
- [ ] Sustituir los adaptadores en memoria por `Mongo*Repository` reales para las entidades del Sprint 1-4.
- [ ] Tests de contrato: los adaptadores Mongo deben cumplir el mismo puerto que los adaptadores en memoria ya probados.

## Sprint 6 (24-30 oct.) — Colchón, validación y cierre

Deliberadamente sin nuevas RF asignadas — es el margen de seguridad antes del 31 de octubre:

- [ ] Usability test (n=1, ver [04_Plan_Verificacion_Validacion.md](../requirements-analysis/04_Plan_Verificacion_Validacion.md)) sobre el flujo completo, centrado en RN-04.
- [ ] Corrección de lo que salga del usability test.
- [ ] Preparar demo de cierre del Ciclo 1.
- [ ] Si sobra tiempo: primeras historias del Ciclo 2, o el experimento de sustituir MongoDB por Supabase/Postgres ([04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md) §7).

---

## Notas de secuenciación

- El orden no sigue la numeración de RF — sigue dependencias reales: sin cuenta+consentimiento (Sprint 1) no se puede probar nada del resto de forma honesta.
- Los adaptadores en memoria van primero en cada sprint; Mongo llega de golpe en el Sprint 5 para no bloquear el desarrollo diario con la base de datos real (ADR-03 §3.4).
- Si algún sprint se retrasa, RF-05 (Sprint 2) y RF-23 (Sprint 5) son las candidatas menos costosas de mover al Sprint 6, porque ningún otro RF del Ciclo 1 depende de ellas.

---

## Historial de cambios

- **v1.0 (12 sept. 2026)** — versión inicial: 11 RF del Ciclo 1 repartidos en Sprint 0 + 6 sprints semanales, dimensionados a 10-12h/semana con el Sprint 6 como colchón antes del plazo del 31 de octubre.
