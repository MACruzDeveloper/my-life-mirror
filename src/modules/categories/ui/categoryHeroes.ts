import adventureDesktop from "../../../assets/categories/aventura-1672.webp";
import adventureMobile from "../../../assets/categories/aventura-828.webp";
import sportDesktop from "../../../assets/categories/deporte-1672.webp";
import sportMobile from "../../../assets/categories/deporte-828.webp";
import spiritualityDesktop from "../../../assets/categories/espiritualidad-1672.webp";
import spiritualityMobile from "../../../assets/categories/espiritualidad-828.webp";
import volunteeringDesktop from "../../../assets/categories/voluntariado-1672.webp";
import volunteeringMobile from "../../../assets/categories/voluntariado-828.webp";
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
   * La imagen (generada con IA) tiene elementos que pueden recordar a marcas reales, aunque sin
   * logotipos: la página lo aclara al pie. En Deporte, los colores del coche de Fórmula 1.
   */
  resemblesBrands?: boolean;
}

export const CATEGORY_HEROES: Record<CategoryPageKey, CategoryHero> = {
  aventura: { desktop: adventureDesktop, mobile: adventureMobile },
  deporte: { desktop: sportDesktop, mobile: sportMobile, resemblesBrands: true },
  espiritualidad: { desktop: spiritualityDesktop, mobile: spiritualityMobile },
  voluntariado: { desktop: volunteeringDesktop, mobile: volunteeringMobile },
};
