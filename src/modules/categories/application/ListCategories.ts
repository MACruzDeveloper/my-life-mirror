import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result";
import { ValidationError } from "../../../shared/domain/DomainError";
import { DEFAULT_LOCALE } from "../../../shared/domain/locales";
import type { Category } from "../domain/Category";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository";
import type { CategoryRepository } from "../domain/CategoryRepository";

/**
 * Caso de uso — RF-06, ADM-02. Sincroniza las categorías del usuario con el
 * catálogo global cada vez que las consulta: por cada entrada vigente que aún
 * no tiene copia (por `catalogId`, no por nombre: cambiar un texto no duplica
 * nada) se crea una, inactiva; las retiradas dejan de listarse — su fila y sus
 * evaluaciones se conservan. La copia guarda el texto del idioma por defecto;
 * la interfaz muestra cada idioma buscando por `catalogId`.
 */
export function createListCategories(repository: CategoryRepository, catalog: CategoryCatalogRepository) {
  return async function listCategories(userId: string): Promise<Result<Category[], ValidationError>> {
    const id = userId.trim();
    if (id.length === 0) return err(new ValidationError("User is required"));

    const current = (await catalog.findAll()).filter((entry) => !entry.retiredAt);
    const existing = await repository.findByUserId(id);
    const linkedCatalogIds = new Set(existing.map((category) => category.catalogId));

    const created: Category[] = current
      .filter((entry) => !linkedCatalogIds.has(entry.id))
      .map((entry) => {
        const text = entry.translations[DEFAULT_LOCALE] ?? { name: "", description: "" };
        return {
          id: randomUUID(),
          userId: id,
          catalogId: entry.id,
          name: text.name,
          description: text.description,
          type: "standard",
          status: "inactive",
          isSensitiveData: entry.isSensitiveData,
        };
      });

    const all = created.length > 0 ? (await repository.saveMany(created), await repository.findByUserId(id)) : existing;

    const currentIds = new Set(current.map((entry) => entry.id));
    return ok(all.filter((category) => category.catalogId !== undefined && currentIds.has(category.catalogId)));
  };
}
