import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { ForbiddenError } from "../../../shared/domain/DomainError.js";
import type { AuthProvider, UsuarioAutenticado, UsuarioResumen } from "../domain/AuthProvider.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

export type ListedUser = UsuarioResumen & { readonly name?: string };

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
  return async function listUsers(actor: UsuarioAutenticado): Promise<Result<ListedUser[], ForbiddenError>> {
    if (actor.rol !== "admin") {
      return err(new ForbiddenError("Se requiere rol de administrador"));
    }

    const usuarios = await authProvider.listarUsuarios();
    const conNombre = await Promise.all(
      usuarios.map(async (u): Promise<ListedUser> => {
        const perfil = await profileRepository.findByUserId(u.id);
        return perfil ? { ...u, name: perfil.name } : u;
      }),
    );
    return ok(conNombre.sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime()));
  };
}
