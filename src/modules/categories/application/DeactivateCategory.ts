import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { NotFoundError, ValidationError } from "../../../shared/domain/DomainError.js";
import type { Category } from "../domain/Category.js";
import type { CategoryRepository } from "../domain/CategoryRepository.js";

export interface DeactivateCategoryInput {
  userId: string;
  categoryId: string;
}

/** Caso de uso — RF-07. Desactivar nunca requiere consentimiento (solo activar). */
export function createDeactivateCategory(repository: CategoryRepository) {
  return async function deactivateCategory(
    input: DeactivateCategoryInput,
  ): Promise<Result<Category, ValidationError | NotFoundError>> {
    const userId = input.userId.trim();
    const categoryId = input.categoryId.trim();

    if (userId.length === 0) return err(new ValidationError("User is required"));
    if (categoryId.length === 0) return err(new ValidationError("Category is required"));

    const category = await repository.findById(userId, categoryId);
    if (!category) return err(new NotFoundError("Category not found"));

    const updated: Category = { ...category, status: "inactive" };
    await repository.save(updated);
    return ok(updated);
  };
}
