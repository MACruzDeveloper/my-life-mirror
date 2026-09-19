import type { Category } from "./Category";

/** Puerto — ADR-03 §3.3. */
export interface CategoryRepository {
  findByUserId(userId: string): Promise<Category[]>;
  findById(userId: string, categoryId: string): Promise<Category | undefined>;
  save(category: Category): Promise<void>;
  saveMany(categories: Category[]): Promise<void>;
}
