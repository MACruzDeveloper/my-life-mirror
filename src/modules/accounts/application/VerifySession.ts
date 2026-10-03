import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { type AuthenticationError, DomainError, ValidationError } from "../../../shared/domain/DomainError.js";
import type { AuthProvider, AuthenticatedUser } from "../domain/AuthProvider.js";

/** Caso de uso — comprueba la cookie de sesión (ADR-06, RF-39 nota "spec viva"). */
export function createVerifySession(authProvider: AuthProvider) {
  return async function verifySession(
    token: string | undefined,
  ): Promise<Result<AuthenticatedUser, ValidationError | AuthenticationError>> {
    if (!token) {
      return err(new ValidationError("No hay sesión"));
    }

    try {
      const user = await authProvider.verifySession(token);
      return ok(user);
    } catch (error) {
      if (error instanceof DomainError) return err(error as ValidationError | AuthenticationError);
      return err(new ValidationError("No se pudo verificar la sesión"));
    }
  };
}
