import { type Result, err, ok } from "../../../shared/domain/Result";
import { ForbiddenError } from "../../../shared/domain/DomainError";
import type { AuthProvider, UsuarioAutenticado, UsuarioResumen } from "../domain/AuthProvider";

/**
 * Caso de uso — ADM-01. Solo un admin puede listar usuarios. La comprobación
 * vive aquí, en la capa de aplicación, y no solo en el endpoint: así ningún
 * controlador futuro puede exponer la lista por olvidarse de comprobar el
 * rol (control de acceso en profundidad). `actor` debe venir de la sesión
 * verificada en el servidor, nunca de datos que envíe el cliente.
 * Ver docs/user-stories/ADM-01-panel-administracion.md.
 */
export function createListUsers(authProvider: AuthProvider) {
  return async function listUsers(actor: UsuarioAutenticado): Promise<Result<UsuarioResumen[], ForbiddenError>> {
    if (actor.rol !== "admin") {
      return err(new ForbiddenError("Se requiere rol de administrador"));
    }

    const usuarios = await authProvider.listarUsuarios();
    return ok([...usuarios].sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime()));
  };
}
