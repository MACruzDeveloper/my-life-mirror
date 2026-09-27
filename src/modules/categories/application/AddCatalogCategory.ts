import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result";
import { type Actor, requireAdmin } from "../../../shared/domain/Actor";
import { ConflictError, type ForbiddenError, ValidationError } from "../../../shared/domain/DomainError";
import { type Locale, SUPPORTED_LOCALES } from "../../../shared/domain/locales";
import type { CatalogCategory, CategoryText } from "../domain/CatalogCategory";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository";

export const MAX_NAME_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 200;

export interface AddCatalogCategoryInput {
  /** Texto en **cada** idioma soportado (RNF-10). */
  translations: Record<Locale, CategoryText>;
  isSensitiveData: boolean;
}

/**
 * Caso de uso — ADM-02. Añade una categoría al catálogo global; llega a los
 * usuarios la próxima vez que listan (ver ListCategories), inactiva. Exige
 * nombre y descripción en cada idioma soportado, con los mismos límites. Un
 * nombre no se repite en ningún idioma, sin distinguir mayúsculas, ni frente
 * a las retiradas (reutilizarlo confundiría el historial).
 */
export function createAddCatalogCategory(catalog: CategoryCatalogRepository) {
  return async function addCatalogCategory(
    actor: Actor,
    input: AddCatalogCategoryInput,
  ): Promise<Result<CatalogCategory, ForbiddenError | ValidationError | ConflictError>> {
    const permission = requireAdmin(actor);
    if (!permission.ok) return permission;

    const translations = {} as Record<Locale, CategoryText>;
    for (const locale of SUPPORTED_LOCALES) {
      const name = input.translations?.[locale]?.name?.trim() ?? "";
      const description = input.translations?.[locale]?.description?.trim() ?? "";
      if (name.length === 0) return err(new ValidationError(`Name (${locale}) is required`));
      if (name.length > MAX_NAME_LENGTH) return err(new ValidationError(`Name (${locale}) must be at most ${MAX_NAME_LENGTH} characters`));
      if (description.length === 0) return err(new ValidationError(`Description (${locale}) is required`));
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        return err(new ValidationError(`Description (${locale}) must be at most ${MAX_DESCRIPTION_LENGTH} characters`));
      }
      translations[locale] = { name, description };
    }

    const takenNames = new Set(
      (await catalog.findAll()).flatMap((entry) => Object.values(entry.translations).map((text) => text?.name.toLowerCase())),
    );
    if (Object.values(translations).some((text) => takenNames.has(text.name.toLowerCase()))) {
      return err(new ConflictError("A category with that name already exists"));
    }

    const created: CatalogCategory = { id: randomUUID(), translations, isSensitiveData: input.isSensitiveData };
    await catalog.save(created);
    return ok(created);
  };
}
