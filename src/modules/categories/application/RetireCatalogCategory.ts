import { type Result, err, ok } from "../../../shared/domain/Result";
import { type Actor, requireAdmin } from "../../../shared/domain/Actor";
import { type ForbiddenError, NotFoundError } from "../../../shared/domain/DomainError";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository";
import type { CategoryRepository } from "../domain/CategoryRepository";

/**
 * Caso de uso — ADM-02. Retira una categoría: se marca `retiredAt` (no se
 * borra) y se desactiva en todos los usuarios para que deje de contar en
 * resultados y de admitir puntuaciones. Las evaluaciones ya guardadas se
 * conservan (RF-12). Idempotente: retirar una ya retirada no falla.
 */
export function createRetireCatalogCategory(catalog: CategoryCatalogRepository, categoryRepository: CategoryRepository, now: () => Date = () => new Date()) {
  return async function retireCatalogCategory(actor: Actor, categoryId: string): Promise<Result<void, ForbiddenError | NotFoundError>> {
    const permiso = requireAdmin(actor);
    if (!permiso.ok) return permiso;

    const entrada = (await catalog.findAll()).find((c) => c.id === categoryId);
    if (!entrada) return err(new NotFoundError("Category not found"));

    if (!entrada.retiredAt) {
      await catalog.save({ ...entrada, retiredAt: now() });
    }
    await categoryRepository.deactivateByName(entrada.name);
    return ok(undefined);
  };
}
