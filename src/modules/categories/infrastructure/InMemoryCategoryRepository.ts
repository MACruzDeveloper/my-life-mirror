import type { Category } from "../domain/Category.js";
import type { CategoryRepository, CategoryTags } from "../domain/CategoryRepository.js";

/** Fake para tests — ADR-03 apartado 3.6. */
export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly categories = new Map<string, Category>();

  private key(userId: string, categoryId: string): string {
    return `${userId}:${categoryId}`;
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return [...this.categories.values()].filter((c) => c.userId === userId);
  }

  async findById(userId: string, categoryId: string): Promise<Category | undefined> {
    return this.categories.get(this.key(userId, categoryId));
  }

  async save(category: Category): Promise<void> {
    this.categories.set(this.key(category.userId, category.id), category);
  }

  async updateTags(userId: string, categoryId: string, tags: CategoryTags): Promise<void> {
    const current = this.categories.get(this.key(userId, categoryId));
    if (current) this.categories.set(this.key(userId, categoryId), { ...current, ...tags });
  }

  async saveMany(categories: Category[]): Promise<void> {
    for (const category of categories) {
      await this.save(category);
    }
  }

  async deactivateByCatalogId(catalogId: string): Promise<void> {
    for (const [key, category] of this.categories) {
      if (category.catalogId === catalogId) this.categories.set(key, { ...category, status: "inactive" });
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [key, category] of this.categories) {
      if (category.userId === userId) this.categories.delete(key);
    }
  }
}
