import { type Result, err, ok } from "../../../shared/domain/Result.js";
import type { ValidationError } from "../../../shared/domain/DomainError.js";
import { Email } from "../domain/Email.js";
import type { AuthProvider } from "../domain/AuthProvider.js";

export interface RequestPasswordResetInput {
  email: string;
}

/**
 * Caso de uso — RF-38. Siempre responde ok si el email tiene formato válido,
 * exista o no la cuenta — nunca revela si un email está registrado.
 */
export function createRequestPasswordReset(authProvider: AuthProvider) {
  return async function solicitarRecuperacion(
    input: RequestPasswordResetInput,
  ): Promise<Result<void, ValidationError>> {
    const email = Email.create(input.email);
    if (!email.ok) return err(email.error);

    await authProvider.requestPasswordReset(email.value.value);
    return ok(undefined);
  };
}
