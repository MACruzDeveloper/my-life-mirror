import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { AuthenticationError, ConflictError, DomainError, ValidationError } from "../../../shared/domain/DomainError.js";
import { type EraseUserDependencies, createEraseUser } from "./EraseUser.js";

export interface DeleteAccountInput {
  userId: string;
  /** Sale de la sesión verificada en el servidor, nunca del cliente. */
  email: string;
  password: string;
}

/**
 * Caso de uso — RF-05, derecho al olvido. Exige volver a escribir la
 * contraseña (una sesión abierta en un equipo ajeno no basta para destruir la
 * cuenta) y la comprueba contra Supabase Auth con el email de la sesión.
 * El único administrador no puede eliminarse (ConflictError): siempre debe
 * quedar uno. Orden del borrado: datos primero, cuenta de acceso la última — si algo
 * falla por el camino el usuario sigue pudiendo entrar y repetirlo (todos los
 * pasos son repetibles); al revés quedarían datos huérfanos sin nadie que
 * pueda pedir su borrado. Los fakes en memoria no tienen `on delete cascade`,
 * así que no se delega en la cascada de la base de datos.
 * Ver docs/user-stories/RF-05-exportar-eliminar-datos.md.
 */
export function createDeleteAccount(dependencies: EraseUserDependencies) {
  const { authProvider } = dependencies;
  const eraseUser = createEraseUser(dependencies);

  return async function deleteAccount(input: DeleteAccountInput): Promise<Result<void, ValidationError | AuthenticationError | ConflictError>> {
    if (input.password.length === 0) return err(new ValidationError("Password is required"));

    // Siempre debe existir un administrador: el último no puede borrarse (antes de pedir la
    // contraseña — no es información sensible y así el usuario sabe qué hacer sin probar nada).
    const users = await authProvider.listAllUsers();
    const esAdmin = users.some((u) => u.id === input.userId && u.rol === "admin");
    if (esAdmin && users.filter((u) => u.rol === "admin").length <= 1) {
      return err(new ConflictError("Cannot delete the only administrator account"));
    }

    try {
      const session = await authProvider.logIn(input.email, input.password);
      if (session.id !== input.userId) return err(new AuthenticationError("Contraseña incorrecta"));
    } catch (error) {
      if (error instanceof DomainError) return err(new AuthenticationError("Contraseña incorrecta"));
      throw error;
    }

    await eraseUser(input.userId);
    return ok(undefined);
  };
}
