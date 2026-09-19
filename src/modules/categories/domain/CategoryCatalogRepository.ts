import type { CatalogCategory } from "./CatalogCategory";

/** Puerto — ADR-03 §3.3. */
export interface CategoryCatalogRepository {
  /** Todas, también las retiradas. */
  findAll(): Promise<CatalogCategory[]>;
  save(category: CatalogCategory): Promise<void>;
}
