import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "#shared/domain/Result.js";
import { ValidationError } from "#shared/domain/DomainError.js";
import type { Clock } from "#shared/domain/Clock.js";
import type { Consent } from "../domain/Consent.js";
import type { ConsentRepository } from "../domain/ConsentRepository.js";

export interface GrantConsentInput {
  userId: string;
  categoryId: string;
  policyVersion: string;
}

/**
 * Caso de uso — RF-04. Se dispara como extensión al activar una categoría
 * marcada como dato sensible (ver docs/requirements-analysis/08_Diagrama_Secuencia_Consentimiento.md).
 * Idempotente para la misma versión de política: otorgarlo dos veces no crea
 * un duplicado, pero un cambio de `versionPolitica` sí exige (y crea) un
 * consentimiento nuevo — uno viejo no cubre una política distinta (RD-05).
 */
export function createGrantConsent(repository: ConsentRepository, clock: Clock) {
  return async function grantConsent(
    input: GrantConsentInput,
  ): Promise<Result<Consent, ValidationError>> {
    const userId = input.userId.trim();
    const categoryId = input.categoryId.trim();
    const policyVersion = input.policyVersion.trim();

    if (userId.length === 0) return err(new ValidationError("El usuario es obligatorio"));
    if (categoryId.length === 0) return err(new ValidationError("La categoría es obligatoria"));
    if (policyVersion.length === 0) return err(new ValidationError("La versión de la política es obligatoria"));

    const existing = await repository.findUser(userId, categoryId, policyVersion);
    if (existing) return ok(existing);

    const consent: Consent = {
      id: randomUUID(),
      userId: userId,
      categoryId: categoryId,
      policyVersion: policyVersion,
      grantedAt: clock.now(),
    };
    await repository.save(consent);
    return ok(consent);
  };
}
