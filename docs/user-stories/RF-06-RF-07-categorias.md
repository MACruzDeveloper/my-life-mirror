# Historia: Catálogo de categorías y activación individual

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-06, RF-07, RD-02, RF-04, [05_Diagrama_Clases.md](../requirements-analysis/05_Diagrama_Clases.md), [08_Diagrama_Secuencia_Consentimiento.md](../requirements-analysis/08_Diagrama_Secuencia_Consentimiento.md)

Como usuario
Quiero ver un catálogo de categorías de vida y activar o desactivar las que me interesan
Para centrar la app solo en lo que quiero seguir, sin ruido de lo que no

## Alcance

- **RF-06** — catálogo inicial de 9 categorías estándar: economía, vida social, pareja, sexo, deporte, aventura, espiritualidad, familia, inversiones. `sexo`, `deporte` y `espiritualidad` están marcadas `esDatoSensible=true` (categoría especial RGPD Art. 9 — sexo/orientación, salud, religión — RNF-04/RES-04); el resto, `false`.
- **RF-07** — activar/desactivar cada categoría individualmente. Activar una sensible dispara el flujo de consentimiento (RF-04) ya construido, por fin conectado a un disparador real — ver 08_Diagrama_Secuencia_Consentimiento.md.
- **RF-08** (categorías personalizadas) queda fuera — Could, fuera del MVP por ahora. El modelo (`type: "standard" | "custom"`) ya lo admite sin cambios futuros.
- **Sin RN de RD-02 sobre dónde vive el catálogo**: cada usuario tiene su propia copia de las 9 categorías estándar (mismo modelo que ya usa `Categoria` en RD-02 — sin tabla de catálogo global aparte), sembrada la primera vez que consulta su lista — no en el registro, para no acoplar `RegisterUser` a un módulo más.
- **Persistencia real desde el principio** (no en memoria): este dato se escribe desde un endpoint y se lee desde otro — la lección de RF-03 (ver [04_Almacenamiento_Datos.md](../architecture-decisions/04_Almacenamiento_Datos.md) §7bis) se aplica aquí sin repetir el error.
- **Versión de política simplificada**: no existe todavía una pantalla real de política de privacidad — se usa una constante (`CURRENT_POLICY_VERSION`) como marcador de la versión vigente. Cuando exista una página de política real, esa constante pasa a derivarse de ella, no a mano.

## Criterios de aceptación

1. Given un usuario que consulta su lista de categorías por primera vez
   When no tiene ninguna categoría todavía
   Then se le siembran las 9 categorías estándar, todas inactivas por defecto

2. Given una categoría no sensible, inactiva
   When el usuario la activa
   Then queda activa inmediatamente, sin pedir nada más

3. Given una categoría sensible, inactiva, sin consentimiento otorgado para la versión de política vigente
   When el usuario intenta activarla
   Then la activación se rechaza con un motivo específico ("requiere consentimiento") — la categoría sigue inactiva

4. Given el caso anterior
   When el usuario otorga el consentimiento y reintenta activar
   Then la categoría queda activa

5. Given una categoría sensible con consentimiento ya otorgado bajo la versión de política vigente
   When el usuario la activa
   Then queda activa directamente, sin volver a pedir consentimiento (mismo criterio de idempotencia que ya tenía RF-04)

6. Given el usuario cierra o cancela el modal de consentimiento
   When no otorga el consentimiento
   Then la categoría permanece inactiva — puede reintentarlo cuando quiera

7. Given cualquier categoría, activa o inactiva
   When el usuario la desactiva
   Then queda inactiva sin ninguna comprobación adicional (desactivar nunca requiere consentimiento)

## Nota de diseño — por qué "requiere consentimiento" no es un error de validación

Es una respuesta de negocio esperable, no un dato mal formado — de ahí un `ConsentRequiredError` propio en la jerarquía de `DomainError` (ADR-03 §3.2), en vez de forzarlo dentro de `ValidationError`. El frontend lo distingue por `code` para decidir si muestra el modal de consentimiento o un mensaje de error genérico.

## Historial de cambios

- **v1.0 (15 sept. 2026)** — versión inicial.
- **v1.1 (19 sept. 2026)** — la página de categorías desaparece: las categorías se eligen/activan desde la entrevista ([RF-10-entrevista.md](RF-10-entrevista.md)), con el mismo consentimiento para las sensibles. desactivar es desmarcarla ahí. La gestión del catálogo por el administrador se plantea en [ADM-01](ADM-01-panel-administracion.md).
- **v1.2 (19 sept. 2026)** — el catálogo estándar deja de estar fijo en código: pasa a la tabla `category_catalog` y `ListCategories` sincroniza con ella al listar ([ADM-02](ADM-02-catalogo-categorias.md)); `ActivateCategory` rechaza las retiradas.
