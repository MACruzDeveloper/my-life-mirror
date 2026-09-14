# ADR-09: Internacionalización (i18n)

**Estado:** Aceptado
**Fecha:** 14 de septiembre de 2026
**Relacionado con:** [07_UI.md](07_UI.md), RNF-10

---

## 1. Librería: react-i18next

Se adopta **react-i18next** (sobre `i18next`) para cumplir RNF-10 (español e inglés como mínimo desde el lanzamiento). Es la opción estándar del ecosistema React, ya apuntada como candidata natural en el ADR de stack tecnológico.

- Config centralizada en [src/shared/ui/i18n.ts](../../src/shared/ui/i18n.ts) — vive en `shared/ui/` (no en `shared/infrastructure/`) porque es un problema de presentación, igual que `theme.ts`; nunca se importa desde `api/` (AGENTS.md).
- Catálogos de texto en `src/shared/ui/i18n/locales/{es,en}.json`, con los mismos namespaces que las páginas/módulos que los usan (`comun`, `breadcrumbs`, `landing`, `registro`, `login`, `olvidePassword`, `restablecerPassword`, `panel`).
- Recursos **incluidos en el bundle** (sin `i18next-http-backend`): el catálogo es pequeño para el MVP, así se evita una petición de red extra solo para cargar textos. Se revisita si el catálogo crece mucho.

## 2. Sin detección automática del navegador

Se descarta `i18next-browser-languagedetector`. El idioma por defecto es **español** (coherente con el resto del proyecto), y el cambio de idioma es una acción explícita del usuario mediante el selector del `Header` ([src/shared/ui/Header.tsx](../../src/shared/ui/Header.tsx)) — la elección se recuerda en `localStorage`. Esto simplifica el comportamiento (nada de heurísticas sobre `navigator.language`) y hace el arranque determinista, lo cual también evita que el idioma del entorno de test (jsdom) cambie el idioma por defecto de las pantallas entre ejecuciones.

## 3. Testing

- Un test de configuración (`tests/shared/ui/i18n.test.ts`) verifica: idioma inicial `es`, **paridad de claves** entre `es.json` y `en.json` (evita que una traducción quede a medias sin que ningún test lo note), y que `changeLanguage` traduce correctamente.
- `tests/setup.ts` importa `@shared/ui/i18n` como efecto secundario, igual que hace `main.tsx` en la app real, para que cualquier componente que use `useTranslation()` tenga el idioma listo en los tests sin repetir el import en cada archivo.
- Los tests de componentes existentes siguen buscando texto en español (idioma por defecto) sin cambios — la traducción no debía romper ninguna aserción existente, y así fue.

---

## Historial de cambios

- **v1.0 (14 sept. 2026)** — versión inicial: react-i18next, recursos embebidos, sin detección automática de idioma (selector manual en el Header), test de paridad de claves.
