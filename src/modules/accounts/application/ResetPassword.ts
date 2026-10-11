import { type Result, err, ok } from "#shared/domain/Result.js";
import { type AuthenticationError, DomainError, ValidationError } from "#shared/domain/DomainError.js";
import { Password, type WeakPasswordError } from "../domain/Password.js";
import type { AuthProvider } from "../domain/AuthProvider.js";

export interface ResetPasswordInput {
  token: string;
  password: string;
}

/** Caso de uso — RF-38. Valida la nueva contraseña antes de gastar el token con el proveedor de auth. */
export function createResetPassword(authProvider: AuthProvider) {
  return async function resetPassword(
    input: ResetPasswordInput,
  ): Promise<Result<void, ValidationError | AuthenticationError | WeakPasswordError>> {
    const password = Password.create(input.password);
    if (!password.ok) return err(password.error);

    try {
      await authProvider.resetPassword(input.token, password.value.value);
      return ok(undefined);
    } catch (error) {
      if (error instanceof DomainError) return err(error as ValidationError | AuthenticationError);
      return err(new ValidationError("No se pudo restablecer la contraseña"));
    }
  };
}
