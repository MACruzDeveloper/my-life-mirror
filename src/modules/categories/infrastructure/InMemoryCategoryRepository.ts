import type { Category } from "../domain/Category";
import type { CategoryRepository } from "../domain/CategoryRepository";

/** Fake para tests — ADR-03 §3.6. */
export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly categories = new Map<string, Category>();

  private clave(userId: string, categoryId: string): string {
    return `${userId}:${categoryId}`;
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return [...this.categories.values()].filter((c) => c.userId === userId);
  }

  async findById(userId: string, categoryId: string): Promise<Category | undefined> {
    return this.categories.get(this.clave(userId, categoryId));
  }

  async save(category: Category): Promise<void> {
    this.categories.set(this.clave(category.userId, category.id), category);
  }

  async saveMany(categories: Category[]): Promise<void> {
    for (const category of categories) {
      await this.save(category);
    }
  }

  async deactivateByName(name: string): Promise<void> {
    for (const [clave, category] of this.categories) {
      if (category.name === name) this.categories.set(clave, { ...category, status: "inactive" });
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [clave, category] of this.categories) {
      if (category.userId === userId) this.categories.delete(clave);
    }
  }
}
