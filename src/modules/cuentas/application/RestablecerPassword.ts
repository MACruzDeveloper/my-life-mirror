import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { type AuthenticationError, DomainError, ValidationError } from "../../../shared/domain/DomainError.js";
import { Password } from "../domain/Password.js";
import type { AuthProvider } from "../domain/AuthProvider.js";

export interface RestablecerPasswordInput {
  token: string;
  password: string;
}

/** Caso de uso — RF-38. Valida la nueva contraseña antes de gastar el token con el proveedor de auth. */
export function crearRestablecerPassword(authProvider: AuthProvider) {
  return async function restablecerPassword(
    input: RestablecerPasswordInput,
  ): Promise<Result<void, ValidationError | AuthenticationError>> {
    const password = Password.crear(input.password);
    if (!password.ok) return err(password.error);

    try {
      await authProvider.restablecerPassword(input.token, password.value.valor);
      return ok(undefined);
    } catch (error) {
      if (error instanceof DomainError) return err(error as ValidationError | AuthenticationError);
      return err(new ValidationError("No se pudo restablecer la contraseña"));
    }
  };
}
