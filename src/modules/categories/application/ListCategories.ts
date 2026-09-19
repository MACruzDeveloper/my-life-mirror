import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result";
import { ValidationError } from "../../../shared/domain/DomainError";
import type { Category } from "../domain/Category";
import type { CategoryRepository } from "../domain/CategoryRepository";
import { STANDARD_CATEGORIES } from "../domain/standardCategories";

/**
 * Caso de uso — RF-06. Siembra las categorías estándar la primera vez que
 * el usuario consulta su lista (no en el registro, para no acoplar
 * RegisterUser a un módulo más — ver docs/user-stories/RF-06-RF-07-categorias.md).
 */
export function createListCategories(repository: CategoryRepository) {
  return async function listCategories(userId: string): Promise<Result<Category[], ValidationError>> {
    const id = userId.trim();
    if (id.length === 0) return err(new ValidationError("User is required"));

    const existentes = await repository.findByUserId(id);
    if (existentes.length > 0) return ok(existentes);

    const nuevas: Category[] = STANDARD_CATEGORIES.map((plantilla) => ({
      id: randomUUID(),
      userId: id,
      name: plantilla.name,
      description: plantilla.description,
      type: "standard",
      status: "inactive",
      isSensitiveData: plantilla.isSensitiveData,
    }));
    await repository.saveMany(nuevas);
    return ok(nuevas);
  };
}
