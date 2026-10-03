import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { NotFoundError, ValidationError } from "../../../shared/domain/DomainError.js";
import type { Category } from "../domain/Category.js";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "../domain/CategoryRepository.js";
import { experienceOptionsFor } from "../domain/experienceOptions.js";

export interface SetCategoryExperienceInput {
  userId: string;
  categoryId: string;
  tags: string[];
}

/**
 * Caso de uso — RF-41. Sustituye las opciones de "¿Qué te ayuda?" de una
 * categoría del usuario. Solo acepta opciones de esa categoría (la clave sale
 * del catálogo, no del cliente): así la IA de RF-40 nunca recibe nada que no
 * esté en la lista cerrada.
 */
export function createSetCategoryExperience(categoryRepository: CategoryRepository, catalog: CategoryCatalogRepository) {
  return async function setCategoryExperience(input: SetCategoryExperienceInput): Promise<Result<Category, ValidationError | NotFoundError>> {
    const userId = input.userId.trim();
    const categoryId = input.categoryId.trim();
    if (userId.length === 0) return err(new ValidationError("User is required"));
    if (categoryId.length === 0) return err(new ValidationError("Category is required"));

    const category = await categoryRepository.findById(userId, categoryId);
    if (!category) return err(new NotFoundError("Category not found"));

    const categoryKey = (await catalog.findAll()).find((entry) => entry.id === category.catalogId)?.key;
    const allowed = new Set(experienceOptionsFor(categoryKey));
    const tags = [...new Set(input.tags)];
    if (tags.some((tag) => !allowed.has(tag))) return err(new ValidationError("Unknown option for this category"));

    const updated: Category = { ...category, experienceTags: tags };
    await categoryRepository.save(updated);
    return ok(updated);
  };
}
