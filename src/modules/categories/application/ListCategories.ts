import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result";
import { ValidationError } from "../../../shared/domain/DomainError";
import type { Category } from "../domain/Category";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository";
import type { CategoryRepository } from "../domain/CategoryRepository";

/**
 * Caso de uso — RF-06, ADM-02. Sincroniza las categorías del usuario con el
 * catálogo global cada vez que las consulta: las categorías vigentes que le
 * faltan se crean inactivas (así una categoría nueva del admin llega también
 * a usuarios existentes, sin migración por usuario) y las retiradas dejan de
 * listarse — su fila y sus evaluaciones se conservan. Sigue sin acoplar
 * RegisterUser a este módulo: la primera consulta es la que siembra.
 */
export function createListCategories(repository: CategoryRepository, catalog: CategoryCatalogRepository) {
  return async function listCategories(userId: string): Promise<Result<Category[], ValidationError>> {
    const id = userId.trim();
    if (id.length === 0) return err(new ValidationError("User is required"));

    const vigentes = (await catalog.findAll()).filter((entrada) => !entrada.retiredAt);
    const existentes = await repository.findByUserId(id);
    const nombresExistentes = new Set(existentes.map((c) => c.name));

    const nuevas: Category[] = vigentes
      .filter((entrada) => !nombresExistentes.has(entrada.name))
      .map((entrada) => ({
        id: randomUUID(),
        userId: id,
        name: entrada.name,
        description: entrada.description,
        ...(entrada.nameEn ? { nameEn: entrada.nameEn } : {}),
        ...(entrada.descriptionEn ? { descriptionEn: entrada.descriptionEn } : {}),
        type: "standard",
        status: "inactive",
        isSensitiveData: entrada.isSensitiveData,
      }));

    const todas = nuevas.length > 0 ? (await repository.saveMany(nuevas), await repository.findByUserId(id)) : existentes;

    const nombresVigentes = new Set(vigentes.map((entrada) => entrada.name));
    return ok(todas.filter((c) => nombresVigentes.has(c.name)));
  };
}
