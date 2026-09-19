import { randomUUID } from "node:crypto";
import type { CatalogCategory } from "../domain/CatalogCategory";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository";
import { STANDARD_CATEGORIES } from "../domain/standardCategories";

/**
 * Fake para tests — ADR-03 §3.6. Arranca con las 9 estándar, como la
 * migración 0005 hace en la base de datos real.
 */
export class InMemoryCategoryCatalogRepository implements CategoryCatalogRepository {
  private readonly entries = new Map<string, CatalogCategory>(
    STANDARD_CATEGORIES.map((c) => {
      const id = randomUUID();
      return [id, { id, name: c.name, description: c.description, isSensitiveData: c.isSensitiveData }];
    }),
  );

  async findAll(): Promise<CatalogCategory[]> {
    return [...this.entries.values()];
  }

  async save(category: CatalogCategory): Promise<void> {
    this.entries.set(category.id, category);
  }
}
