/**
 * Idiomas de la aplicación (RNF-10). Añadir uno = añadirlo aquí, su archivo de
 * textos de la interfaz (`shared/ui/i18n/locales/`) y las traducciones de las
 * categorías (filas en `category_translations`); sin cambios de esquema.
 * El tipo `Locale` hace que el compilador avise de cada sitio que necesita el
 * idioma nuevo (p. ej. las categorías estándar).
 */
export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
/** Idioma de reserva cuando falta una traducción. */
export const DEFAULT_LOCALE: Locale = "es";

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
