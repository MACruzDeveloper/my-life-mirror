import { randomBytes, randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { requireAdmin } from "../../../shared/domain/Actor.js";
import type { Clock } from "../../../shared/domain/Clock.js";
import { AuthenticationError, ConflictError, DomainError, ForbiddenError, NotFoundError, ValidationError } from "../../../shared/domain/DomainError.js";
import { Email } from "../domain/Email.js";
import type { AdminAuditEntry } from "../domain/AdminAuditEntry.js";
import type { AdminAuditRepository } from "../domain/AdminAuditRepository.js";
import type { AuthenticatedUser, UserSummary } from "../domain/AuthProvider.js";
import { VALID_ROLES, type UserRole } from "../domain/UserRole.js";
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

  async function record(actor: AuthenticatedUser, action: string, targetId?: string, detail?: string) {
    const entry: AdminAuditEntry = {
      id: randomUUID(),
      actorId: actor.id,
      action,
      ...(targetId ? { targetId } : {}),
      ...(detail ? { detail } : {}),
      occurredAt: clock.now(),
    };
    await auditRepository.add(entry);
  }

  async function confirmPassword(actor: AuthenticatedUser, password: string): Promise<Result<void, ValidationError | AuthenticationError>> {
    if (password.length === 0) return err(new ValidationError("Password is required"));
    try {
      const session = await authProvider.logIn(actor.email, password);
      if (session.id === actor.id) return ok(undefined);
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
    }
    await record(actor, "reauth.failed");
    return err(new AuthenticationError("Contraseña incorrecta"));
  }

  async function findUser(userId: string): Promise<UserSummary | undefined> {
    return (await authProvider.listAllUsers()).find((u) => u.id === userId);
  }

  /** Suspender o eliminar: ni a uno mismo (eso es RF-05) ni a un administrador (primero se degrada). */
  function protectedTarget(actor: AuthenticatedUser, target: UserSummary): ConflictError | undefined {
    if (target.id === actor.id) return new ConflictError("Use your own account page for this action");
    if (target.rol === "admin") return new ConflictError("Demote the administrator first: there must always be at least one");
    return undefined;
  }

  return {
    async changeRole(input: { actor: AuthenticatedUser; userId: string; rol: UserRole; password: string }): Promise<Result<void, AdminError>> {
      const permission = requireAdmin(input.actor);
      if (!permission.ok) return permission;
      if (!(VALID_ROLES as readonly string[]).includes(input.rol)) return err(new ValidationError("Invalid role"));
      const confirmed = await confirmPassword(input.actor, input.password);
      if (!confirmed.ok) return confirmed;

      const target = await findUser(input.userId);
      if (!target) return err(new NotFoundError("User not found"));
      // Nadie se cambia su propio rol: así el último administrador nunca puede degradarse a sí mismo.
      if (target.id === input.actor.id) return err(new ConflictError("You can't change your own role"));
      if (target.rol === input.rol) return ok(undefined);

      await authProvider.changeRole(target.id, input.rol);
      await record(input.actor, "role.changed", target.id, `${target.rol}->${input.rol}`);
      return ok(undefined);
    },

    async suspendUser(input: { actor: AuthenticatedUser; userId: string; password: string }): Promise<Result<void, AdminError>> {
      const permission = requireAdmin(input.actor);
      if (!permission.ok) return permission;
      const confirmed = await confirmPassword(input.actor, input.password);
      if (!confirmed.ok) return confirmed;

      const target = await findUser(input.userId);
      if (!target) return err(new NotFoundError("User not found"));
      const blocker = protectedTarget(input.actor, target);
      if (blocker) return err(blocker);

      await authProvider.suspend(target.id);
      await record(input.actor, "user.suspended", target.id);
      return ok(undefined);
    },

    async reactivateUser(input: { actor: AuthenticatedUser; userId: string }): Promise<Result<void, AdminError>> {
      const permission = requireAdmin(input.actor);
      if (!permission.ok) return permission;
      const target = await findUser(input.userId);
      if (!target) return err(new NotFoundError("User not found"));

      await authProvider.reactivate(target.id);
      await record(input.actor, "user.reactivated", target.id);
      return ok(undefined);
    },

    async deleteUser(input: { actor: AuthenticatedUser; userId: string; password: string }): Promise<Result<void, AdminError>> {
      const permission = requireAdmin(input.actor);
      if (!permission.ok) return permission;
      const confirmed = await confirmPassword(input.actor, input.password);
      if (!confirmed.ok) return confirmed;

      const target = await findUser(input.userId);
      if (!target) return err(new NotFoundError("User not found"));
      const blocker = protectedTarget(input.actor, target);
      if (blocker) return err(blocker);

      await eraseUser(target.id);
      // Solo el id: el email desaparece con la cuenta (derecho al olvido).
      await record(input.actor, "user.deleted", target.id);
      return ok(undefined);
    },

    async updateEmail(input: { actor: AuthenticatedUser; userId: string; email: string; password: string }): Promise<Result<void, AdminError>> {
      const permission = requireAdmin(input.actor);
      if (!permission.ok) return permission;
      const email = Email.create(input.email);
      if (!email.ok) return email;
      const confirmed = await confirmPassword(input.actor, input.password);
      if (!confirmed.ok) return confirmed;

      const target = await findUser(input.userId);
      if (!target) return err(new NotFoundError("User not found"));

      try {
        await authProvider.changeEmail(target.id, email.value.value);
      } catch (error) {
        if (error instanceof ConflictError) return err(error);
        throw error;
      }
      // Sin los emails en la anotación: son datos personales.
      await record(input.actor, "user.email.changed", target.id);
      return ok(undefined);
    },

    async updateName(input: { actor: AuthenticatedUser; userId: string; name: string }): Promise<Result<void, AdminError>> {
      const permission = requireAdmin(input.actor);
      if (!permission.ok) return permission;
      const name = input.name.trim();
      if (name.length === 0) return err(new ValidationError("Name is required"));
      if (name.length > MAX_NAME_LENGTH) return err(new ValidationError(`Name must be at most ${MAX_NAME_LENGTH} characters`));
      const target = await findUser(input.userId);
      if (!target) return err(new NotFoundError("User not found"));

      const result = await updateProfile({ userId: target.id, name });
      if (!result.ok) return err(result.error as ValidationError);
      await record(input.actor, "user.name.changed", target.id);
      return ok(undefined);
    },

    /**
     * Crea la cuenta con una contraseña temporal aleatoria que solo se devuelve
     * esta vez (no se guarda ni se anota). El admin se la entrega a la persona,
     * que debería cambiarla con "He olvidado mi contraseña" en cuanto pueda.
     */
    async createUser(input: { actor: AuthenticatedUser; email: string; name: string }): Promise<Result<{ id: string; email: string; temporaryPassword: string }, AdminError>> {
      const permission = requireAdmin(input.actor);
      if (!permission.ok) return permission;

      const temporaryPassword = randomBytes(12).toString("base64url");
      const result = await registerUser({ email: input.email, password: temporaryPassword, name: input.name });
      if (!result.ok) return result;

      await record(input.actor, "user.created", result.value.id);
      return ok({ id: result.value.id, email: result.value.email, temporaryPassword });
    },

    async sendRecoveryLink(input: { actor: AuthenticatedUser; userId: string }): Promise<Result<void, AdminError>> {
      const permission = requireAdmin(input.actor);
      if (!permission.ok) return permission;
      const target = await findUser(input.userId);
      if (!target) return err(new NotFoundError("User not found"));

      await authProvider.requestPasswordReset(target.email);
      await record(input.actor, "user.recovery.sent", target.id);
      return ok(undefined);
    },

    async listAudit(actor: AuthenticatedUser): Promise<Result<AdminAuditEntry[], ForbiddenError>> {
      const permission = requireAdmin(actor);
      if (!permission.ok) return permission;
      return ok(await auditRepository.findRecent(AUDIT_LIST_LIMIT));
    },
  };
}
