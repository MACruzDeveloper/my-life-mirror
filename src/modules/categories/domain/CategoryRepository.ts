import type { Category } from "./Category";

/** Puerto — ADR-03 §3.3. */
export interface CategoryRepository {
  findByUserId(userId: string): Promise<Category[]>;
  findById(userId: string, categoryId: string): Promise<Category | undefined>;
  save(category: Category): Promise<void>;
  saveMany(categories: Category[]): Promise<void>;
  /** Desactiva esa categoría (por nombre) en todos los usuarios — al retirarla del catálogo (ADM-02). No borra nada. */
  deactivateByName(name: string): Promise<void>;
}
