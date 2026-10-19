# Historia: Catálogo de categorías gestionable por el administrador

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Estado:** Implementada (diseño confirmado el 19 sept. 2026).
**Referencias:** [ADM-01](ADM-01-panel-administracion.md), RF-06/RF-07 ([RF-06-RF-07-categorias.md](RF-06-RF-07-categorias.md)), RF-08 (categorías personalizadas del usuario, Could — distinto de esto)

Como administrador
Quiero añadir categorías nuevas y retirar las que den problemas, sin tocar código ni SQL
Para hacer evolucionar el catálogo según lo que aprenda de los usuarios

## Prioridad

1. **Añadir** (la que más importa): una categoría nueva aparece sola en la entrevista de todos los usuarios, inactiva, para que la marquen si quieren.
2. **Retirar**: si los usuarios se quejan de una categoría, el admin la retira.
3. **Avisar** a los usuarios (correo/notificación) de una categoría nueva o retirada: **idea anotada, no incluida** — depende de RF-23 (notificaciones, Could, bajo la línea de corte) y necesitaría consentimiento explícito para comunicaciones (RF-04). Se diseña cuando exista RF-23; mientras, el usuario ve la novedad al abrir la entrevista.

## Diseño propuesto (cambio mínimo sobre el modelo actual)

Hoy cada usuario tiene su copia de las categorías, sembrada desde una lista fija en código la primera vez que las consulta. No se toca esa estructura; se añade **un catálogo global** que pasa a ser la fuente de la siembra:

- Tabla `category_catalog` (`supabase/migrations/0005_category_catalog.sql`, a ejecutar a mano) (`id`, `name` único, `description`, `is_sensitive_data`, `retired_at` nulo mientras esté vigente). La migración la rellena con las 9 categorías estándar actuales (desaparece la lista fija del código).
- `ListCategories` **sincroniza al listar**: si al usuario le faltan categorías vigentes del catálogo (por nombre), las crea inactivas — la misma siembra perezosa de hoy, ahora repetida en cada consulta. Así una categoría nueva llega a usuarios existentes sin migración por usuario.
- **Retirar = marcar `retired_at`, nunca borrar.** Las filas de los usuarios y sus evaluaciones se conservan (historial y RF-12 intactos). Al retirar, además, se **desactiva la categoría en todos los usuarios** (`CategoryRepository.deactivateByName`): así deja de contar en resultados y de admitir puntuaciones sin tocar esos casos de uso; deja de listarse, `ActivateCategory` la rechaza (también ante una llamada directa a la API) y el historial sigue mostrando su nombre.
- **Multidioma (RNF-10):** al crear una categoría se exigen nombre y descripción en **cada idioma soportado** (`SUPPORTED_LOCALES`, hoy español e inglés; mismos límites). Un nombre no puede repetirse frente a ningún otro nombre del catálogo, en ningún idioma y sin distinguir mayúsculas (incluidas las retiradas). Los textos se guardan en una tabla aparte, `category_translations` (una fila por categoría e idioma, migración 0009), y la copia de cada usuario enlaza con su entrada del catálogo por `catalog_id`. La interfaz pide las traducciones por id (`GET /api/categories/translations`) y muestra el idioma activo, con el español como reserva. Las 9 estándar siguen el mismo modelo (tienen además una `key` estable que usan los ejemplos y las recomendaciones). El formulario y la tabla del panel generan un campo/columna por idioma: añadir un idioma no cambia el esquema ni los componentes.
- Nombre único sin distinguir mayúsculas, también frente a las retiradas; nombre ≤ 60 y descripción ≤ 200 caracteres.
- Ambas siembras (`category_catalog` y `public.categories`) ignoran duplicados por nombre, para que dos listados simultáneos del mismo usuario no choquen.
- Endpoints solo admin (mismo patrón que ADM-01: sesión en servidor + comprobación en el caso de uso): `GET/POST /api/admin/categories`, `POST /api/admin/categories/retire`. Casos de uso `AddCatalogCategory`, `RetireCatalogCategory`, `ListCatalog`.
- Pestaña "Categorías" en `/admin` (implementada): tabla del catálogo, formulario para añadir (nombre, descripción, ¿sensible?) y botón de retirar con confirmación.
- La marca `is_sensitive_data` **no se puede cambiar** tras crear la categoría (cambiarla afectaría a consentimientos ya otorgados): para eso se retira y se crea otra.

## Criterios de aceptación

1. Given un admin
   When añade una categoría con nombre único, descripción y marca de sensible
   Then entra en el catálogo y aparece, inactiva, en la entrevista de cada usuario la próxima vez que la abra

2. Given un nombre ya existente en el catálogo (vigente o retirado)
   When se intenta añadir
   Then se rechaza por duplicado

3. Given un admin
   When retira una categoría
   Then deja de listarse, no se puede activar y desaparece de resultados, pero las evaluaciones ya guardadas se conservan

4. Given un usuario no admin
   When llama a cualquier endpoint de catálogo
   Then recibe 403 y no cambia nada

## Decisiones tomadas

1. **Retirar = ocultar, no borrar** (borrar destruiría evaluaciones; contradice RF-12).
2. **Una categoría sensible nueva** nace inactiva y pide consentimiento al activarla, sin excepciones.
3. **Aviso a usuarios:** se deja para RF-23 (correo/notificación, con consentimiento a comunicaciones); mientras, la categoría nueva aparece al abrir la entrevista.
