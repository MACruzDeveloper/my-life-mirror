import { randomBytes, randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { requireAdmin } from "../../../shared/domain/Actor.js";
import type { Clock } from "../../../shared/domain/Clock.js";
import { AuthenticationError, ConflictError, DomainError, ForbiddenError, NotFoundError, ValidationError } from "../../../shared/domain/DomainError.js";
import { Email } from "../domain/Email.js";
import type { AdminAuditEntry } from "../domain/AdminAuditEntry.js";
import type { AdminAuditRepository } from "../domain/AdminAuditRepository.js";
import type { UsuarioAutenticado, UsuarioResumen } from "../domain/AuthProvider.js";
import { ROLES_VALIDOS, type RolUsuario } from "../domain/RolUsuario.js";
import { type EraseUserDependencies, createEraseUser } from "./EraseUser.js";
import type { createRegisterUser } from "./RegisterUser.js";
import type { createUpdateProfile } from "./UpdateProfile.js";

const MAX_NAME_LENGTH = 100;
const AUDIT_LIST_LIMIT = 100;

type AdminError = ForbiddenError | ValidationError | NotFoundError | ConflictError | AuthenticationError;

interface Dependencies extends EraseUserDependencies {
  auditRepository: AdminAuditRepository;
  registerUser: ReturnType<typeof createRegisterUser>;
  updateProfile: ReturnType<typeof createUpdateProfile>;
  clock: Clock;
}

/**
 * Casos de uso de ADM-03: el admin gestiona las cuentas de otros usuarios.
 * Reglas comunes a todos:
 * - `requireAdmin` en cada uno (defensa en profundidad además del endpoint); `actor`
 *   viene siempre de la sesión verificada en el servidor.
 * - Las acciones sensibles (rol, email, suspender, eliminar) exigen la contraseña del
 *   propio admin, comprobada contra el proveedor de autenticación; un intento fallido
 *   queda anotado (`reauth.failed`).
 * - Siempre debe existir un administrador: nadie puede tocar su propio rol, ni suspender
 *   o eliminar a un administrador (primero se le degrada).
 * - Cada acción realizada se anota en la auditoría, solo con ids y un detalle no sensible.
 * Ver docs/user-stories/ADM-03-gestion-usuarios.md.
 */
export function createAdminUserActions(dependencies: Dependencies) {
  const { authProvider, auditRepository, registerUser, updateProfile, clock } = dependencies;
  const eraseUser = createEraseUser(dependencies);

  async function anotar(actor: UsuarioAutenticado, action: string, targetId?: string, detail?: string) {
    const entrada: AdminAuditEntry = {
      id: randomUUID(),
      actorId: actor.id,
      action,
      ...(targetId ? { targetId } : {}),
      ...(detail ? { detail } : {}),
      occurredAt: clock.now(),
    };
    await auditRepository.add(entrada);
  }

  async function confirmarContrasena(actor: UsuarioAutenticado, password: string): Promise<Result<void, ValidationError | AuthenticationError>> {
    if (password.length === 0) return err(new ValidationError("Password is required"));
    try {
      const sesion = await authProvider.iniciarSesion(actor.email, password);
      if (sesion.id === actor.id) return ok(undefined);
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
    }
    await anotar(actor, "reauth.failed");
    return err(new AuthenticationError("Contraseña incorrecta"));
  }

  async function buscar(userId: string): Promise<UsuarioResumen | undefined> {
    return (await authProvider.listarUsuarios()).find((u) => u.id === userId);
  }

  /** Suspender o eliminar: ni a uno mismo (eso es RF-05) ni a un administrador (primero se degrada). */
  function protegido(actor: UsuarioAutenticado, objetivo: UsuarioResumen): ConflictError | undefined {
    if (objetivo.id === actor.id) return new ConflictError("Use your own account page for this action");
    if (objetivo.rol === "admin") return new ConflictError("Demote the administrator first: there must always be at least one");
    return undefined;
  }

  return {
    async changeRole(input: { actor: UsuarioAutenticado; userId: string; rol: RolUsuario; password: string }): Promise<Result<void, AdminError>> {
      const permiso = requireAdmin(input.actor);
      if (!permiso.ok) return permiso;
      if (!(ROLES_VALIDOS as readonly string[]).includes(input.rol)) return err(new ValidationError("Invalid role"));
      const confirmado = await confirmarContrasena(input.actor, input.password);
      if (!confirmado.ok) return confirmado;

      const objetivo = await buscar(input.userId);
      if (!objetivo) return err(new NotFoundError("User not found"));
      // Nadie se cambia su propio rol: así el último administrador nunca puede degradarse a sí mismo.
      if (objetivo.id === input.actor.id) return err(new ConflictError("You can't change your own role"));
      if (objetivo.rol === input.rol) return ok(undefined);

      await authProvider.cambiarRol(objetivo.id, input.rol);
      await anotar(input.actor, "role.changed", objetivo.id, `${objetivo.rol}->${input.rol}`);
      return ok(undefined);
    },

    async suspendUser(input: { actor: UsuarioAutenticado; userId: string; password: string }): Promise<Result<void, AdminError>> {
      const permiso = requireAdmin(input.actor);
      if (!permiso.ok) return permiso;
      const confirmado = await confirmarContrasena(input.actor, input.password);
      if (!confirmado.ok) return confirmado;

      const objetivo = await buscar(input.userId);
      if (!objetivo) return err(new NotFoundError("User not found"));
      const bloqueo = protegido(input.actor, objetivo);
      if (bloqueo) return err(bloqueo);

      await authProvider.suspender(objetivo.id);
      await anotar(input.actor, "user.suspended", objetivo.id);
      return ok(undefined);
    },

    async reactivateUser(input: { actor: UsuarioAutenticado; userId: string }): Promise<Result<void, AdminError>> {
      const permiso = requireAdmin(input.actor);
      if (!permiso.ok) return permiso;
      const objetivo = await buscar(input.userId);
      if (!objetivo) return err(new NotFoundError("User not found"));

      await authProvider.reactivar(objetivo.id);
      await anotar(input.actor, "user.reactivated", objetivo.id);
      return ok(undefined);
    },

    async deleteUser(input: { actor: UsuarioAutenticado; userId: string; password: string }): Promise<Result<void, AdminError>> {
      const permiso = requireAdmin(input.actor);
      if (!permiso.ok) return permiso;
      const confirmado = await confirmarContrasena(input.actor, input.password);
      if (!confirmado.ok) return confirmado;

      const objetivo = await buscar(input.userId);
      if (!objetivo) return err(new NotFoundError("User not found"));
      const bloqueo = protegido(input.actor, objetivo);
      if (bloqueo) return err(bloqueo);

      await eraseUser(objetivo.id);
      // Solo el id: el email desaparece con la cuenta (derecho al olvido).
      await anotar(input.actor, "user.deleted", objetivo.id);
      return ok(undefined);
    },

    async updateEmail(input: { actor: UsuarioAutenticado; userId: string; email: string; password: string }): Promise<Result<void, AdminError>> {
      const permiso = requireAdmin(input.actor);
      if (!permiso.ok) return permiso;
      const email = Email.crear(input.email);
      if (!email.ok) return email;
      const confirmado = await confirmarContrasena(input.actor, input.password);
      if (!confirmado.ok) return confirmado;

      const objetivo = await buscar(input.userId);
      if (!objetivo) return err(new NotFoundError("User not found"));

      try {
        await authProvider.actualizarEmail(objetivo.id, email.value.valor);
      } catch (error) {
        if (error instanceof ConflictError) return err(error);
        throw error;
      }
      // Sin los emails en la anotación: son datos personales.
      await anotar(input.actor, "user.email.changed", objetivo.id);
      return ok(undefined);
    },

    async updateName(input: { actor: UsuarioAutenticado; userId: string; name: string }): Promise<Result<void, AdminError>> {
      const permiso = requireAdmin(input.actor);
      if (!permiso.ok) return permiso;
      const name = input.name.trim();
      if (name.length === 0) return err(new ValidationError("Name is required"));
      if (name.length > MAX_NAME_LENGTH) return err(new ValidationError(`Name must be at most ${MAX_NAME_LENGTH} characters`));
      const objetivo = await buscar(input.userId);
      if (!objetivo) return err(new NotFoundError("User not found"));

      const resultado = await updateProfile({ userId: objetivo.id, name });
      if (!resultado.ok) return err(resultado.error as ValidationError);
      await anotar(input.actor, "user.name.changed", objetivo.id);
      return ok(undefined);
    },

    /**
     * Crea la cuenta con una contraseña temporal aleatoria que solo se devuelve
     * esta vez (no se guarda ni se anota). El admin se la entrega a la persona,
     * que debería cambiarla con "He olvidado mi contraseña" en cuanto pueda.
     */
    async createUser(input: { actor: UsuarioAutenticado; email: string; name: string }): Promise<Result<{ id: string; email: string; temporaryPassword: string }, AdminError>> {
      const permiso = requireAdmin(input.actor);
      if (!permiso.ok) return permiso;

      const temporaryPassword = randomBytes(12).toString("base64url");
      const resultado = await registerUser({ email: input.email, password: temporaryPassword, name: input.name });
      if (!resultado.ok) return resultado;

      await anotar(input.actor, "user.created", resultado.value.id);
      return ok({ id: resultado.value.id, email: resultado.value.email, temporaryPassword });
    },

    async sendRecoveryLink(input: { actor: UsuarioAutenticado; userId: string }): Promise<Result<void, AdminError>> {
      const permiso = requireAdmin(input.actor);
      if (!permiso.ok) return permiso;
      const objetivo = await buscar(input.userId);
      if (!objetivo) return err(new NotFoundError("User not found"));

      await authProvider.solicitarRecuperacion(objetivo.email);
      await anotar(input.actor, "user.recovery.sent", objetivo.id);
      return ok(undefined);
    },

    async listAudit(actor: UsuarioAutenticado): Promise<Result<AdminAuditEntry[], ForbiddenError>> {
      const permiso = requireAdmin(actor);
      if (!permiso.ok) return permiso;
      return ok(await auditRepository.findRecent(AUDIT_LIST_LIMIT));
    },
  };
}
