# Historia: Contenido curado como datos (CAT-01)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RD-09 (catálogo curado, gestionable), RF-18, RF-40, RF-41, RF-42, idea ADM-04 (editarlo desde `/admin`), decisión del autor del 5 oct.

Como autor del proyecto (y quien revise su contenido)
Quiero encontrar y revisar el contenido curado en un mismo sitio, como datos y no como código
Para corregirlo sin leer TypeScript y que moverlo a la base de datos (ADM-04) sea casi copiar

## Alcance

- **Sin cambios de comportamiento:** la app hace exactamente lo mismo; los tests de siempre lo comprueban.
- **Una carpeta `domain/catalog/` por módulo** con su contenido curado en JSON, con la forma de las futuras tablas de ADM-04 (una fila por elemento, con su clave estable):
  - `recommendations/domain/catalog/ideas.json`: las ideas del catálogo (`key`, `category`; las generales con `category: null`).
  - `recommendations/domain/catalog/situations.json`: las situaciones de RF-42, en el orden en que se ofrecen, cada una con las ideas con las que choca (`key`, `clashesWith`).
  - `recommendations/domain/catalog/safetyTerms.json`: los términos del filtro de ideas con IA (antes `ideaSafetyTerms.json`).
  - `categories/domain/catalog/helpOptions.json`: las opciones de "¿Qué te ayuda?" de RF-41 (`key`, `category`).
- **Los textos visibles siguen en las traducciones** (`es.json`/`en.json`): en el catálogo solo van claves y relaciones. Con ADM-04 pasarían a la base de datos, como las de las categorías.
- **El código que los usa no cambia de forma:** `templateKeysFor`, `situationOptionsFor`, `allowedTemplateKeys`, `experienceOptionsFor` y el filtro leen el JSON.
- **Tests de integridad del catálogo**, que fallan si se edita mal un JSON: claves únicas, cada idea de una categoría estándar, cada choque apunta a una idea que existe, cada situación choca con alguna idea, cada opción es de una categoría estándar, siempre queda alguna idea general que no choca con nada, y todo elemento tiene texto en español y en inglés.
- **Sin archivo global de constantes** (AGENTS.md): cada módulo guarda el suyo.

## Criterios de aceptación

1. Given el catálogo en JSON
   When se ejecutan los tests de siempre
   Then pasan sin cambiarlos (mismo comportamiento)

2. Given un JSON editado con un choque hacia una idea que no existe, una clave repetida o una opción sin traducción
   When se ejecutan los tests
   Then fallan diciendo cuál

3. Given el código del servidor
   When se compilan y cargan las funciones (`check:api`)
   Then leen los JSON igual que en Vercel

## Historial de cambios

- **v1.0 (5 oct. 2026)** — versión inicial.
