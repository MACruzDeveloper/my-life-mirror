import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result";
import { type Actor, requireAdmin } from "../../../shared/domain/Actor";
import { ConflictError, type ForbiddenError, ValidationError } from "../../../shared/domain/DomainError";
import type { CatalogCategory } from "../domain/CatalogCategory";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository";

export const MAX_NAME_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 200;

export interface AddCatalogCategoryInput {
  name: string;
  description: string;
  isSensitiveData: boolean;
}

/**
 * Caso de uso — ADM-02. Añade una categoría al catálogo global; llega a los
 * usuarios la próxima vez que listan (ver ListCategories), inactiva. El
 * nombre es único sin distinguir mayúsculas, también frente a las retiradas
 * (reutilizarlo confundiría el historial).
 */
export function createAddCatalogCategory(catalog: CategoryCatalogRepository) {
  return async function addCatalogCategory(
    actor: Actor,
    input: AddCatalogCategoryInput,
  ): Promise<Result<CatalogCategory, ForbiddenError | ValidationError | ConflictError>> {
    const permiso = requireAdmin(actor);
    if (!permiso.ok) return permiso;

    const name = input.name.trim();
    const description = input.description.trim();
    if (name.length === 0) return err(new ValidationError("Name is required"));
    if (name.length > MAX_NAME_LENGTH) return err(new ValidationError(`Name must be at most ${MAX_NAME_LENGTH} characters`));
    if (description.length === 0) return err(new ValidationError("Description is required"));
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return err(new ValidationError(`Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`));
    }

    const existentes = await catalog.findAll();
    if (existentes.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return err(new ConflictError("A category with that name already exists"));
    }

    const nueva: CatalogCategory = { id: randomUUID(), name, description, isSensitiveData: input.isSensitiveData };
    await catalog.save(nueva);
    return ok(nueva);
  };
}
