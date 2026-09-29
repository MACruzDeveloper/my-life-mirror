import { randomUUID } from "node:crypto";
import type { CatalogCategory } from "../domain/CatalogCategory.js";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository.js";
import { STANDARD_CATEGORIES } from "../domain/standardCategories.js";

/**
 * Fake para tests — ADR-03 apartado 3.6. Arranca con las 9 estándar y sus textos en
 * cada idioma, como hacen las migraciones 0005 y 0009 en la base de datos real.
 */
export class InMemoryCategoryCatalogRepository implements CategoryCatalogRepository {
  private readonly entries = new Map<string, CatalogCategory>(
    STANDARD_CATEGORIES.map((standard) => {
      const id = randomUUID();
      return [id, { id, key: standard.key, translations: standard.translations, isSensitiveData: standard.isSensitiveData }];
    }),
  );

  async findAll(): Promise<CatalogCategory[]> {
    return [...this.entries.values()];
  }

  async save(category: CatalogCategory): Promise<void> {
    this.entries.set(category.id, category);
  }
}
