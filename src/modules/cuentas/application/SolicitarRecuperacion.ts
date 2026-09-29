import { type Result, err, ok } from "../../../shared/domain/Result.js";
import type { ValidationError } from "../../../shared/domain/DomainError.js";
import { Email } from "../domain/Email.js";
import type { AuthProvider } from "../domain/AuthProvider.js";

export interface SolicitarRecuperacionInput {
  email: string;
}

/**
 * Caso de uso — RF-38. Siempre responde ok si el email tiene formato válido,
 * exista o no la cuenta — nunca revela si un email está registrado.
 */
export function crearSolicitarRecuperacion(authProvider: AuthProvider) {
  return async function solicitarRecuperacion(
    input: SolicitarRecuperacionInput,
  ): Promise<Result<void, ValidationError>> {
    const email = Email.crear(input.email);
    if (!email.ok) return err(email.error);

    await authProvider.solicitarRecuperacion(email.value.valor);
    return ok(undefined);
  };
}
