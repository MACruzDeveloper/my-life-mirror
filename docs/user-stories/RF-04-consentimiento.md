# Historia: Consentimiento explícito para categorías sensibles

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-04, RD-02 (`esDatoSensible`), RD-05, [08_Diagrama_Secuencia_Consentimiento.md](../requirements-analysis/08_Diagrama_Secuencia_Consentimiento.md)

Como usuario que activa una categoría marcada como dato sensible (sexo, espiritualidad/religión)
Quiero que el sistema registre mi consentimiento explícito antes de activarla
Para que mis datos sensibles solo se traten con mi autorización informada (RGPD)

## Alcance

Cubre el módulo `consent` (dominio + aplicación): la entidad `Consent` y los casos de uso `GrantConsent`/`CheckConsent`. Persistencia real en Supabase desde el principio (`SupabaseConsentRepository`), no en memoria — ver [04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md) apartado 5.1.

**Disparador real conectado (15 sept. 2026, RF-06/RF-07)**: `ActivateCategory` llama a `CheckConsent` al activar una categoría sensible; si no hay consentimiento, devuelve `ConsentRequiredError` y el frontend muestra el modal, que llama a `api/consent/grant.ts` (primer endpoint real de esta historia) antes de reintentar la activación. Ver [RF-06-RF-07-categorias.md](RF-06-RF-07-categorias.md).

## Criterios de aceptación

1. Given un usuario que activa por primera vez una categoría sensible bajo la versión de política vigente
   When se otorga el consentimiento
   Then se crea un registro con usuario, categoría, versión de política y fecha/hora

2. Given un usuario que ya otorgó consentimiento para esa categoría bajo la misma versión de política
   When se vuelve a otorgar el consentimiento
   Then no se crea un duplicado — se devuelve el consentimiento ya existente (operación idempotente)

3. Given un usuario que otorgó consentimiento bajo una versión de política anterior
   When la política cambia de versión y se comprueba su consentimiento
   Then el consentimiento antiguo no cuenta como válido para la nueva versión — debe volver a otorgarlo

4. Given datos de entrada vacíos (usuario, categoría o versión de política)
   When se intenta otorgar o verificar el consentimiento
   Then se rechaza con un error de validación, sin llegar al repositorio

## Nota de diseño — por qué la versión de política forma parte de la clave

Un consentimiento no es una casilla que se marca una vez para siempre: cubre una política concreta. Si el texto legal cambia de forma sustancial (nueva versión), el consentimiento previo no debería contar como válido para la nueva — de ahí que `versionPolitica` sea parte de la búsqueda en `ConsentRepository.buscar`, no solo un campo informativo (RD-05).

## Historial de cambios

- **v1.0 (14 sept. 2026)** — versión inicial: alcance de Sprint 1 (dominio + aplicación), disparador real diferido a Sprint 2 (RF-07).
- **v2.0 (15 sept. 2026)** — disparador real conectado (`ActivateCategory`, RF-06/RF-07): `api/grant-consent.ts`, primer endpoint de esta historia. Persistencia real en Supabase desde el principio (antes en memoria).
- **v2.1 (6 oct. 2026)** — Deporte deja de ser sensible (decisión del autor, migración 0018): ya no pide consentimiento. Los consentimientos ya dados se conservan como historial. El E2E de esta historia pasa a usar Espiritualidad.
