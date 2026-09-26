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
  nameEn: string;
  descriptionEn: string;
  isSensitiveData: boolean;
}

/**
 * Caso de uso — ADM-02. Añade una categoría al catálogo global; llega a los
 * usuarios la próxima vez que listan (ver ListCategories), inactiva. El
 * nombre es único sin distinguir mayúsculas, también frente a las retiradas
 * (reutilizarlo confundiría el historial). También exige nombre y descripción
 * en inglés (RNF-10), con los mismos límites; el nombre en inglés tampoco se
 * puede repetir.
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
    const nameEn = input.nameEn.trim();
    const descriptionEn = input.descriptionEn.trim();
    for (const [label, value, max] of [
      ["Name", name, MAX_NAME_LENGTH],
      ["Description", description, MAX_DESCRIPTION_LENGTH],
      ["English name", nameEn, MAX_NAME_LENGTH],
      ["English description", descriptionEn, MAX_DESCRIPTION_LENGTH],
    ] as const) {
      if (value.length === 0) return err(new ValidationError(`${label} is required`));
      if (value.length > max) return err(new ValidationError(`${label} must be at most ${max} characters`));
    }

    const existing = await catalog.findAll();
    if (existing.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      return err(new ConflictError("A category with that name already exists"));
    }
    // Tampoco se repite en inglés, ni frente al nombre en inglés ni frente al español de otra categoría.
    const englishTaken = existing.some((category) => [category.nameEn, category.name].some((other) => other?.toLowerCase() === nameEn.toLowerCase()));
    if (englishTaken) {
      return err(new ConflictError("A category with that English name already exists"));
    }

    const nueva: CatalogCategory = { id: randomUUID(), name, description, nameEn, descriptionEn, isSensitiveData: input.isSensitiveData };
    await catalog.save(nueva);
    return ok(nueva);
  };
}
