# ADR-09: Internacionalización (i18n)

**Estado:** Aceptado
**Fecha:** 14 de septiembre de 2026
**Relacionado con:** [07_UI.md](07_UI.md), RNF-10

---

## 1. Librería: react-i18next

Se adopta **react-i18next** (sobre `i18next`) para cumplir RNF-10 (español e inglés como mínimo desde el lanzamiento). Es la opción estándar del ecosistema React, ya apuntada como candidata natural en el ADR de stack tecnológico.

- Config centralizada en [src/shared/ui/i18n/index.ts](../../src/shared/ui/i18n/index.ts) — vive en `shared/ui/` (no en `shared/infrastructure/`) porque es un problema de presentación, igual que `theme.ts`; nunca se importa desde `api/` (AGENTS.md).
- Catálogos de texto en `src/shared/ui/i18n/locales/{es,en}.json`, con los mismos namespaces que las páginas/módulos que los usan (`comun`, `breadcrumbs`, `landing`, `registro`, `login`, `olvidePassword`, `restablecerPassword`, `panel`).
- Recursos **incluidos en el bundle** (sin `i18next-http-backend`): el catálogo es pequeño para el MVP, así se evita una petición de red extra solo para cargar textos. Se revisita si el catálogo crece mucho.

## 2. Sin detección automática del navegador

Se descarta `i18next-browser-languagedetector`. El idioma por defecto es **español** (coherente con el resto del proyecto), y el cambio de idioma es una acción explícita del usuario mediante el selector del `Header` ([src/shared/ui/components/Header.tsx](../../src/shared/ui/components/Header.tsx)) — la elección se recuerda en `localStorage`. Esto simplifica el comportamiento (nada de heurísticas sobre `navigator.language`) y hace el arranque determinista, lo cual también evita que el idioma del entorno de test (jsdom) cambie el idioma por defecto de las pantallas entre ejecuciones.

### 2.1 Textos que vienen de la base de datos: por id, no por columna

Los nombres y descripciones de las categorías no están en `es.json`/`en.json` (el admin las crea en tiempo de ejecución). Se guardan en la tabla `category_translations`, una fila por categoría del catálogo e idioma, y **la interfaz las resuelve por id**:

- Los datos de la API solo llevan `catalogId` (categorías del usuario, últimas puntuaciones, historial, recomendaciones); ningún DTO lleva un campo por idioma.
- `GET /api/categories/translations` devuelve todas las entradas del catálogo con sus traducciones (también las retiradas, para el historial). Se cachea con TanStack Query como el resto.
- `useCategoryLabel()` (`modules/categories/ui/categoryLabels.ts`) devuelve `categoryLabel(catalogId)` → `{ name, description, key }` en el idioma activo, con `DEFAULT_LOCALE` como reserva.
- Solo las páginas traducen; los componentes hoja (tarjetas, gráficos, botón de recomendación) reciben el texto ya resuelto.
- La lista de idiomas vive en un único sitio, `src/shared/domain/locales.ts` (`SUPPORTED_LOCALES`, `DEFAULT_LOCALE`), que usan el caso de uso de alta (exige todos los idiomas), el formulario y la tabla del admin. Añadir un idioma = añadirlo ahí, a los `.json` y a las categorías estándar; ni el esquema ni los DTO cambian.

## 3. Testing

- Un test de configuración (`tests/shared/ui/i18n.test.ts`) verifica: idioma inicial `es`, **paridad de claves** entre `es.json` y `en.json` (evita que una traducción quede a medias sin que ningún test lo note), y que `changeLanguage` traduce correctamente.
- `tests/setup.ts` importa `@shared/ui/i18n` como efecto secundario, igual que hace `main.tsx` en la app real, para que cualquier componente que use `useTranslation()` tenga el idioma listo en los tests sin repetir el import en cada archivo.
- Los tests de componentes existentes siguen buscando texto en español (idioma por defecto) sin cambios — la traducción no debía romper ninguna aserción existente, y así fue.

---

## Historial de cambios

- **v1.0 (14 sept. 2026)** — versión inicial: react-i18next, recursos embebidos, sin detección automática de idioma (selector manual en el Header), test de paridad de claves.
- **v1.1 (15 sept. 2026)** — `i18n.ts` pasa a `i18n/index.ts` (ver [07_UI.md](07_UI.md) apartado 7) — el alias `@shared/ui/i18n` no cambia en ningún sitio que lo use.
- **v1.2 (26 sept. 2026)** — el selector de idioma (`LanguageSwitcher`, nombrado en el idioma de destino: "English"/"Español") está ahora también en las páginas públicas (`PublicLayout`), para poder cambiar a inglés antes de tener cuenta; antes solo existía en la cabecera de las pantallas protegidas. El atributo `lang` de `<html>` sigue al idioma elegido (antes `index.html` declaraba `en` fijo con la app en español). **Hueco conocido:** los nombres y descripciones de las categorías vienen de la base de datos y no se traducen.
- **v1.3 (26 sept. 2026)** — cerrado el hueco de v1.2: los nombres y descripciones de las 9 categorías estándar se traducen en la interfaz (`categoriasEstandar.*`, `modules/categories/ui/categoryLabels.ts`), con los textos en español copiados del catálogo. Se traduce **solo al mostrar**: la lógica (ejemplos, plantillas de recomendación) sigue identificando cada categoría por su nombre guardado. Las categorías que crea el admin se muestran con su nombre tal cual. El panel de administración muestra los datos guardados, sin traducir, a propósito.
- **v1.4 (27 sept. 2026)** — las categorías creadas por el admin también son bilingües: el admin da nombre y descripción en inglés al crearlas (ADM-02 v1.2) y viajan con la categoría (`nameEn`/`descriptionEn` en la categoría del usuario; `categoryNameEn` en últimas puntuaciones, historial y recomendaciones). `categoryLabels` elige: traducción de la interfaz (estándar) → inglés guardado (admin, si la app está en inglés) → nombre guardado.
- **v1.5 (27 sept. 2026)** — sustituye v1.3 y v1.4, a petición del autor ("con 20 idiomas, una variable por idioma no escala"): nueva apartado 2.1. Traducciones de categorías en `category_translations`, resueltas por id en la interfaz; mismo modelo para las estándar y las del admin (se eliminan las claves `categoriasEstandar.*` y los campos `nameEn`/`categoryNameEn`). Lista de idiomas centralizada en `shared/domain/locales.ts`.
- **v1.6 (28 sept. 2026)** — numeración: los apartados "bis/ter" pasan a subapartados decimales del apartado anterior (convención del proyecto, AGENTS.md); referencias actualizadas en todo el repositorio. Sin cambios de contenido.
