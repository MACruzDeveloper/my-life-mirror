import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthProvider, LoggedInSession, AuthenticatedUser, UserSummary } from "../domain/AuthProvider.js";
import { DEFAULT_ROLE, readRoleFromMetadata, type UserRole } from "../domain/UserRole.js";
import { AuthenticationError, ConflictError, ValidationError } from "../../../shared/domain/DomainError.js";

function isSuspended(bannedUntil?: string): boolean {
  return !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
}

/**
 * Adaptador real — ADR-06. Usa la service role key (solo en `api/`, nunca en
 * el navegador). Sin test propio: no hay lógica que probar más allá del SDK
 * de Supabase (mismo criterio que se aplicó a BcryptPasswordHasher).
 */
export class SupabaseAuthProvider implements AuthProvider {
  private readonly client: SupabaseClient;
  private readonly resetPasswordUrl: string;

  constructor(url: string, serviceRoleKey: string, resetPasswordUrl: string) {
    this.client = createClient(url, serviceRoleKey);
    this.resetPasswordUrl = resetPasswordUrl;
  }

  async register(email: string, password: string): Promise<AuthenticatedUser> {
    const { data, error } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // sin confirmación por email en el Ciclo 1 — ver ADR-06 apartado 1
      // Rol explícito desde el alta (RNF-13) — nadie se autorregistra como
      // premium/admin; esos roles se conceden a mano después, vía dashboard.
      app_metadata: { rol: DEFAULT_ROLE },
    });

    if (error) {
      if (error.status === 422 || error.message.toLowerCase().includes("already been registered")) {
        throw new ConflictError("Ya existe una cuenta con ese email");
      }
      throw new ValidationError(error.message);
    }

    return { id: data.user.id, email: data.user.email ?? email, rol: readRoleFromMetadata(data.user.app_metadata) };
  }

  async logIn(email: string, password: string): Promise<LoggedInSession> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      throw new AuthenticationError("Email o contraseña incorrectos");
    }

    return {
      id: data.user.id,
      email: data.user.email ?? email,
      token: data.session.access_token,
    };
  }

  async verifySession(token: string): Promise<AuthenticatedUser> {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthenticationError("Sesión no válida");
    }
    // Una cuenta suspendida (ADM-03) no puede seguir usando una sesión que ya tenía abierta.
    if (isSuspended(data.user.banned_until)) {
      throw new AuthenticationError("Sesión no válida");
    }
    return { id: data.user.id, email: data.user.email ?? "", rol: readRoleFromMetadata(data.user.app_metadata) };
  }

  /** Una sola página de hasta 1000 usuarios: de sobra para el TFM; paginar si algún día hiciera falta. */
  async listAllUsers(): Promise<UserSummary[]> {
    const { data, error } = await this.client.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
      throw new ValidationError(error.message);
    }
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      rol: readRoleFromMetadata(u.app_metadata),
      creadoEn: new Date(u.created_at),
      ultimoAcceso: u.last_sign_in_at ? new Date(u.last_sign_in_at) : undefined,
      suspendido: isSuspended(u.banned_until),
    }));
  }

  async requestPasswordReset(email: string): Promise<void> {
    // Se ignora el error deliberadamente (RF-38): nunca se revela si el email existe.
    await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: this.resetPasswordUrl,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthenticationError("El enlace de recuperación no es válido o ha caducado");
    }

    const { error: errorActualizar } = await this.client.auth.admin.updateUserById(data.user.id, {
      password: newPassword,
    });
    if (errorActualizar) {
      throw new AuthenticationError("El enlace de recuperación no es válido o ha caducado");
    }
  }

  async changeRole(id: string, role: UserRole): Promise<void> {
    const { error } = await this.client.auth.admin.updateUserById(id, { app_metadata: { rol: role } });
    if (error) throw new Error(`No se pudo cambiar el rol: ${error.message}`);
  }

  async changeEmail(id: string, email: string): Promise<void> {
    const { error } = await this.client.auth.admin.updateUserById(id, { email, email_confirm: true });
    if (error) {
      if (error.status === 422 || error.message.toLowerCase().includes("already been registered")) {
        throw new ConflictError("Ya existe una cuenta con ese email");
      }
      throw new Error(`No se pudo cambiar el email: ${error.message}`);
    }
  }

  async suspend(id: string): Promise<void> {
    // Supabase no tiene "suspendida" a secas: se bloquea por un periodo larguísimo (~100 años).
    const { error } = await this.client.auth.admin.updateUserById(id, { ban_duration: "876000h" });
    if (error) throw new Error(`No se pudo suspender la cuenta: ${error.message}`);
  }

  async reactivate(id: string): Promise<void> {
    const { error } = await this.client.auth.admin.updateUserById(id, { ban_duration: "none" });
    if (error) throw new Error(`No se pudo reactivar la cuenta: ${error.message}`);
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.client.auth.admin.deleteUser(id);
    // Ya no existe = el objetivo está cumplido (así el borrado es repetible tras un fallo a medias).
    if (error && error.status !== 404 && !error.message.toLowerCase().includes("not found")) {
      throw new Error(`No se pudo eliminar la cuenta: ${error.message}`);
    }
  }
}
