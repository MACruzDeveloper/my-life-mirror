import adventureDesktop from "../../../assets/categories/aventura-1672.webp";
import adventureMobile from "../../../assets/categories/aventura-828.webp";
import sportDesktop from "../../../assets/categories/deporte-1672.webp";
import sportMobile from "../../../assets/categories/deporte-828.webp";
import type { CategoryPageKey } from "./categoryPages";

/**
 * La imagen de cabecera de cada página de categoría, en dos tamaños (como la
 * portada, UX-08): 1672 px de ancho para escritorio y 828 para móvil, en WebP.
 * Generadas con IA y elegidas por el autor (`src/assets/categories/<clave>-1672.webp`
 * y `-828.webp`); la página lo dice.
 */
export interface CategoryHero {
  desktop: string;
  mobile: string;
  /**
   * La imagen muestra marcas de terceros (generada con IA): la página lo aclara al pie. PROVISIONAL
   * en Deporte (17 oct.), hasta generar una sin logotipos; entonces se quita.
   */
  showsThirdPartyBrands?: boolean;
}

export const CATEGORY_HEROES: Record<CategoryPageKey, CategoryHero> = {
  aventura: { desktop: adventureDesktop, mobile: adventureMobile },
  deporte: { desktop: sportDesktop, mobile: sportMobile, showsThirdPartyBrands: true },
};
