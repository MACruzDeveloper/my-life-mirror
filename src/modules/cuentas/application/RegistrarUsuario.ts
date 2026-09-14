import { type Result, err, ok } from "../../../shared/domain/Result";
import { type ConflictError, DomainError, ValidationError } from "../../../shared/domain/DomainError";
import { Email } from "../domain/Email";
import { Password } from "../domain/Password";
import type { Usuario } from "../domain/Usuario";
import type { AuthProvider } from "../domain/AuthProvider";

export interface RegistrarUsuarioInput {
  email: string;
  password: string;
}

/**
 * Caso de uso — RF-01. Delega la creación real de la cuenta a Supabase Auth
 * a través del puerto AuthProvider (ADR-06); nunca instancia un adaptador
 * él mismo (ADR-03 §3.4).
 */
export function crearRegistrarUsuario(authProvider: AuthProvider) {
  return async function registrarUsuario(
    input: RegistrarUsuarioInput,
  ): Promise<Result<Usuario, ValidationError | ConflictError>> {
    const email = Email.crear(input.email);
    if (!email.ok) return err(email.error);

    const password = Password.crear(input.password);
    if (!password.ok) return err(password.error);

    try {
      const usuario = await authProvider.registrar(email.value.valor, password.value.valor);
      return ok(usuario);
    } catch (error) {
      if (error instanceof DomainError) return err(error as ValidationError | ConflictError);
      return err(new ValidationError("No se pudo completar el registro"));
    }
  };
}
