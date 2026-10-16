import placeholderDesktop from "../../../assets/backgrounds/portada-b-1672.webp";
import placeholderMobile from "../../../assets/backgrounds/portada-b-828.webp";
import type { CategoryPageKey } from "./categoryPages";

/**
 * La imagen de cabecera de cada página de categoría, en dos tamaños (como la
 * portada, UX-08): 1672 px de ancho para escritorio y 828 para móvil, en WebP.
 * PROVISIONAL: todas usan una imagen de la portada hasta que el autor genere
 * las suyas (`src/assets/categories/<clave>-1672.webp` y `-828.webp`).
 */
export const CATEGORY_HEROES: Record<CategoryPageKey, { desktop: string; mobile: string }> = {
  aventura: { desktop: placeholderDesktop, mobile: placeholderMobile },
  deporte: { desktop: placeholderDesktop, mobile: placeholderMobile },
};
