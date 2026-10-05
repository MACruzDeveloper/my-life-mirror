import { type Result, err, ok } from "#shared/domain/Result.js";
import { ForbiddenError } from "#shared/domain/DomainError.js";
import type { AuthProvider, AuthenticatedUser, UserSummary } from "../domain/AuthProvider.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

export type ListedUser = UserSummary & { readonly name?: string };

/**
 * Caso de uso — ADM-01/ADM-03. Solo un admin puede listar usuarios. La comprobación
 * vive aquí, en la capa de aplicación, y no solo en el endpoint: así ningún
 * controlador futuro puede exponer la lista por olvidarse de comprobar el
 * rol (control de acceso en profundidad). `actor` debe venir de la sesión
 * verificada en el servidor, nunca de datos que envíe el cliente. Añade el
 * nombre del perfil (solo eso: ningún dato de contenido) para que el admin
 * reconozca a quién gestiona.
 * Ver docs/user-stories/ADM-01-panel-administracion.md.
 */
export function createListUsers(authProvider: AuthProvider, profileRepository: ProfileRepository) {
  return async function listUsers(actor: AuthenticatedUser): Promise<Result<ListedUser[], ForbiddenError>> {
    if (actor.rol !== "admin") {
      return err(new ForbiddenError("Se requiere rol de administrador"));
    }

    const users = await authProvider.listAllUsers();
    const withName = await Promise.all(
      users.map(async (u): Promise<ListedUser> => {
        const profile = await profileRepository.findByUserId(u.id);
        return profile ? { ...u, name: profile.name } : u;
      }),
    );
    return ok(withName.sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime()));
  };
}
