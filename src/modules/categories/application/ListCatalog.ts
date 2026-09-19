import { type Result } from "../../../shared/domain/Result";
import { ok } from "../../../shared/domain/Result";
import { type Actor, requireAdmin } from "../../../shared/domain/Actor";
import type { ForbiddenError } from "../../../shared/domain/DomainError";
import type { CatalogCategory } from "../domain/CatalogCategory";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository";

/** Caso de uso — ADM-02. Solo admin (comprobado aquí, no solo en el endpoint). Incluye las retiradas. */
export function createListCatalog(catalog: CategoryCatalogRepository) {
  return async function listCatalog(actor: Actor): Promise<Result<CatalogCategory[], ForbiddenError>> {
    const permiso = requireAdmin(actor);
    if (!permiso.ok) return permiso;
    return ok(await catalog.findAll());
  };
}
