/**
 * RF-49: las categorías del catálogo que ya tienen su propia página, por su
 * clave estable. Las demás salen en "Categorías" como "Próximamente".
 */
export const CATEGORY_PAGES = ["aventura", "deporte", "espiritualidad", "voluntariado"] as const;
export type CategoryPageKey = (typeof CATEGORY_PAGES)[number];

export function hasCategoryPage(key: string | undefined): key is CategoryPageKey {
  return key !== undefined && (CATEGORY_PAGES as readonly string[]).includes(key);
}
