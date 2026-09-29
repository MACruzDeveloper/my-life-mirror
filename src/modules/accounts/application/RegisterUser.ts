import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { type ConflictError, DomainError, ValidationError } from "../../../shared/domain/DomainError.js";
import { Email } from "../domain/Email.js";
import { Password } from "../domain/Password.js";
import type { User } from "../domain/User.js";
import type { AuthProvider } from "../domain/AuthProvider.js";
import type { createUpdateProfile } from "./UpdateProfile.js";

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
}

/**
 * Caso de uso — RF-01. Delega la creación real de la cuenta a Supabase Auth
 * a través del puerto AuthProvider (ADR-06); nunca instancia un adaptador
 * él mismo (ADR-03 apartado 3.4).
 *
 * También guarda el `name` como perfil inicial (RF-03) en la misma
 * operación — así el Header nunca tiene que mostrar el email en bruto
 * después de registrarse.
 *
 * El guardado del perfil es "best effort" **de verdad**: va en su propio
 * try/catch, separado del de `authProvider.registrar`. Si no fuera así, una
 * excepción ahí (p. ej. un fallo de red del repositorio real —
 * el adaptador en memoria de los tests no puede lanzar) caería en el
 * catch de fuera y reportaría el registro entero como fallido, aunque la
 * cuenta de Supabase Auth ya se hubiera creado un instante antes. El nombre
 * siempre se puede rellenar después desde la pantalla de perfil; la cuenta,
 * una vez creada, no debería poder deshacerse por este motivo.
 */
export function createRegisterUser(authProvider: AuthProvider, updateProfile: ReturnType<typeof createUpdateProfile>) {
  return async function registerUser(
    input: RegisterUserInput,
  ): Promise<Result<User, ValidationError | ConflictError>> {
    const email = Email.create(input.email);
    if (!email.ok) return err(email.error);

    const password = Password.create(input.password);
    if (!password.ok) return err(password.error);

    const name = input.name.trim();
    if (name.length === 0) return err(new ValidationError("Name is required"));

    let user: User;
    try {
      user = await authProvider.registrar(email.value.value, password.value.value);
    } catch (error) {
      if (error instanceof DomainError) return err(error as ValidationError | ConflictError);
      return err(new ValidationError("No se pudo completar el registro"));
    }

    try {
      await updateProfile({ userId: user.id, name });
    } catch {
      // Ver nota de diseño arriba: un fallo aquí no debe deshacer un
      // registro que ya es válido.
    }

    return ok(user);
  };
}
