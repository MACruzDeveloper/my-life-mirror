import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { type Actor, requireAdmin } from "../../../shared/domain/Actor.js";
import { type ForbiddenError, NotFoundError } from "../../../shared/domain/DomainError.js";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "../domain/CategoryRepository.js";

/**
 * Caso de uso — ADM-02. Retira una categoría: se marca `retiredAt` (no se
 * borra) y se desactiva en todos los usuarios para que deje de contar en
 * resultados y de admitir puntuaciones. Las evaluaciones ya guardadas se
 * conservan (RF-12). Idempotente: retirar una ya retirada no falla.
 */
export function createRetireCatalogCategory(catalog: CategoryCatalogRepository, categoryRepository: CategoryRepository, now: () => Date = () => new Date()) {
  return async function retireCatalogCategory(actor: Actor, categoryId: string): Promise<Result<void, ForbiddenError | NotFoundError>> {
    const permission = requireAdmin(actor);
    if (!permission.ok) return permission;

    const entry = (await catalog.findAll()).find((c) => c.id === categoryId);
    if (!entry) return err(new NotFoundError("Category not found"));

    if (!entry.retiredAt) {
      await catalog.save({ ...entry, retiredAt: now() });
    }
    await categoryRepository.deactivateByCatalogId(entry.id);
    return ok(undefined);
  };
}
