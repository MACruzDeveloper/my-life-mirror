import { type Result, err, ok } from "#shared/domain/Result.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import type { Category } from "#modules/categories/domain/Category.js";
import type { CategoryCatalogRepository } from "#modules/categories/domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { situationOptionsFor } from "../domain/ideaSituations.js";

export interface SetCategoryDifficultiesInput {
  userId: string;
  categoryId: string;
  tags: string[];
}

/**
 * Caso de uso — RF-42. Sustituye las situaciones que le ponen difícil una
 * categoría al usuario. Solo acepta las que se ofrecen en esa categoría (la
 * clave sale del catálogo, no del cliente). Vive en recomendaciones, no en
 * categorías, porque las situaciones válidas dependen del catálogo de ideas.
 */
export function createSetCategoryDifficulties(categoryRepository: CategoryRepository, catalog: CategoryCatalogRepository) {
  return async function setCategoryDifficulties(input: SetCategoryDifficultiesInput): Promise<Result<Category, ValidationError | NotFoundError>> {
    const userId = input.userId.trim();
    const categoryId = input.categoryId.trim();
    if (userId.length === 0) return err(new ValidationError("User is required"));
    if (categoryId.length === 0) return err(new ValidationError("Category is required"));

    const category = await categoryRepository.findById(userId, categoryId);
    if (!category) return err(new NotFoundError("Category not found"));

    const categoryKey = (await catalog.findAll()).find((entry) => entry.id === category.catalogId)?.key;
    const offered = new Set<string>(situationOptionsFor(categoryKey));
    const tags = [...new Set(input.tags)];
    if (tags.some((tag) => !offered.has(tag))) return err(new ValidationError("Unknown situation for this category"));

    const updated: Category = { ...category, difficultyTags: tags };
    await categoryRepository.save(updated);
    return ok(updated);
  };
}
