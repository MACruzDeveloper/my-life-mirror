import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { type AuthenticationError, DomainError, ValidationError } from "../../../shared/domain/DomainError.js";
import { Email } from "../domain/Email.js";
import type { AuthProvider, LoggedInSession } from "../domain/AuthProvider.js";

export interface LogInInput {
  email: string;
  password: string;
}

/**
 * Caso de uso — RF-01 (login). No aplica la política de longitud de
 * contraseña de Password aquí — eso es una regla de alta, no de acceso; el
 * proveedor de auth es la fuente de verdad de si las credenciales son
 * correctas (ADR-06).
 */
export function createLogIn(authProvider: AuthProvider) {
  return async function iniciarSesion(
    input: LogInInput,
  ): Promise<Result<LoggedInSession, ValidationError | AuthenticationError>> {
    const email = Email.create(input.email);
    if (!email.ok) return err(email.error);

    if (input.password.length === 0) {
      return err(new ValidationError("La contraseña es obligatoria"));
    }

    try {
      const session = await authProvider.logIn(email.value.value, input.password);
      return ok(session);
    } catch (error) {
      if (error instanceof DomainError) return err(error as ValidationError | AuthenticationError);
      return err(new ValidationError("No se pudo iniciar sesión"));
    }
  };
}
