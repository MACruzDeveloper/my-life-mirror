import { type Result, err, ok } from "../../../shared/domain/Result";
import { type AuthenticationError, DomainError, ValidationError } from "../../../shared/domain/DomainError";
import type { AuthProvider, UsuarioAutenticado } from "../domain/AuthProvider";

/** Caso de uso — comprueba la cookie de sesión (ADR-06, RF-39 nota "spec viva"). */
export function crearVerificarSesion(authProvider: AuthProvider) {
  return async function verificarSesion(
    token: string | undefined,
  ): Promise<Result<UsuarioAutenticado, ValidationError | AuthenticationError>> {
    if (!token) {
      return err(new ValidationError("No hay sesión"));
    }

    try {
      const usuario = await authProvider.verificarSesion(token);
      return ok(usuario);
    } catch (error) {
      if (error instanceof DomainError) return err(error as ValidationError | AuthenticationError);
      return err(new ValidationError("No se pudo verificar la sesión"));
    }
  };
}
