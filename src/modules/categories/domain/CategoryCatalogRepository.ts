import type { CatalogCategory } from "./CatalogCategory.js";

/** Puerto — ADR-03 apartado 3.3. */
export interface CategoryCatalogRepository {
  /** Todas, también las retiradas. */
  findAll(): Promise<CatalogCategory[]>;
  save(category: CatalogCategory): Promise<void>;
}
