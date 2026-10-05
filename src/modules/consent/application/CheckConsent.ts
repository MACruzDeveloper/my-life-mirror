import { type Result, err, ok } from "#shared/domain/Result.js";
import { ValidationError } from "#shared/domain/DomainError.js";
import type { ConsentRepository } from "../domain/ConsentRepository.js";

export interface CheckConsentInput {
  userId: string;
  categoryId: string;
  policyVersion: string;
}

/**
 * Caso de uso de solo lectura — comprueba si el usuario ya otorgó
 * consentimiento para una categoría bajo la versión de política vigente.
 * Lo usará `ActivarCategoria` (RF-07) para decidir si mostrar el
 * modal de consentimiento o activar la categoría directamente.
 */
export function createCheckConsent(repository: ConsentRepository) {
  return async function checkConsent(
    input: CheckConsentInput,
  ): Promise<Result<boolean, ValidationError>> {
    const userId = input.userId.trim();
    const categoryId = input.categoryId.trim();
    const policyVersion = input.policyVersion.trim();

    if (userId.length === 0) return err(new ValidationError("El usuario es obligatorio"));
    if (categoryId.length === 0) return err(new ValidationError("La categoría es obligatoria"));
    if (policyVersion.length === 0) return err(new ValidationError("La versión de la política es obligatoria"));

    const existing = await repository.findUser(userId, categoryId, policyVersion);
    return ok(existing !== undefined);
  };
}
