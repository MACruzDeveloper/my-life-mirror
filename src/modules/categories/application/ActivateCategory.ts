import { type Result, err, ok } from "../../../shared/domain/Result";
import { ConsentRequiredError, NotFoundError, ValidationError } from "../../../shared/domain/DomainError";
import type { Category } from "../domain/Category";
import type { CategoryRepository } from "../domain/CategoryRepository";
import type { crearVerificarConsentimiento } from "../../consentimiento/application/VerificarConsentimiento";

export interface ActivateCategoryInput {
  userId: string;
  categoryId: string;
  policyVersion: string;
}

/**
 * Caso de uso — RF-07, extendido por RF-04 cuando la categoría es sensible
 * (ver docs/requirements-analysis/08_Diagrama_Secuencia_Consentimiento.md).
 * `ConsentRequiredError` es la señal de negocio que le dice al frontend
 * "muestra el modal de consentimiento", no un error de validación.
 */
export function createActivateCategory(
  categoryRepository: CategoryRepository,
  verifyConsent: ReturnType<typeof crearVerificarConsentimiento>,
) {
  return async function activateCategory(
    input: ActivateCategoryInput,
  ): Promise<Result<Category, ValidationError | NotFoundError | ConsentRequiredError>> {
    const userId = input.userId.trim();
    const categoryId = input.categoryId.trim();
    const policyVersion = input.policyVersion.trim();

    if (userId.length === 0) return err(new ValidationError("User is required"));
    if (categoryId.length === 0) return err(new ValidationError("Category is required"));
    if (policyVersion.length === 0) return err(new ValidationError("Policy version is required"));

    const category = await categoryRepository.findById(userId, categoryId);
    if (!category) return err(new NotFoundError("Category not found"));

    if (category.isSensitiveData) {
      const consentResult = await verifyConsent({
        usuarioId: userId,
        categoriaId: categoryId,
        versionPolitica: policyVersion,
      });
      if (!consentResult.ok) return err(consentResult.error);
      if (!consentResult.value) {
        return err(new ConsentRequiredError("Consent is required to activate this category"));
      }
    }

    const updated: Category = { ...category, status: "active" };
    await categoryRepository.save(updated);
    return ok(updated);
  };
}
