import type { Category } from "./Category.js";

/** Puerto — ADR-03 apartado 3.3. */
export interface CategoryRepository {
  findByUserId(userId: string): Promise<Category[]>;
  findById(userId: string, categoryId: string): Promise<Category | undefined>;
  save(category: Category): Promise<void>;
  saveMany(categories: Category[]): Promise<void>;
  /** Borra todas las categorías del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
  /** Desactiva, en todos los usuarios, las copias de esa entrada del catálogo — al retirarla (ADM-02). No borra nada. */
  deactivateByCatalogId(catalogId: string): Promise<void>;
}
