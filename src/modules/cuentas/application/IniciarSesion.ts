import { type Result, err, ok } from "../../../shared/domain/Result";
import { type AuthenticationError, DomainError, ValidationError } from "../../../shared/domain/DomainError";
import { Email } from "../domain/Email";
import type { AuthProvider, SesionIniciada } from "../domain/AuthProvider";

export interface IniciarSesionInput {
  email: string;
  password: string;
}

/**
 * Caso de uso — RF-01 (login). No aplica la política de longitud de
 * contraseña de Password aquí — eso es una regla de alta, no de acceso; el
 * proveedor de auth es la fuente de verdad de si las credenciales son
 * correctas (ADR-06).
 */
export function crearIniciarSesion(authProvider: AuthProvider) {
  return async function iniciarSesion(
    input: IniciarSesionInput,
  ): Promise<Result<SesionIniciada, ValidationError | AuthenticationError>> {
    const email = Email.crear(input.email);
    if (!email.ok) return err(email.error);

    if (input.password.length === 0) {
      return err(new ValidationError("La contraseña es obligatoria"));
    }

    try {
      const sesion = await authProvider.iniciarSesion(email.value.valor, input.password);
      return ok(sesion);
    } catch (error) {
      if (error instanceof DomainError) return err(error as ValidationError | AuthenticationError);
      return err(new ValidationError("No se pudo iniciar sesión"));
    }
  };
}
