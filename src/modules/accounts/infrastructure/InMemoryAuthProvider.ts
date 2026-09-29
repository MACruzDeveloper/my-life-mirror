import { randomUUID } from "node:crypto";
import type { AuthProvider, LoggedInSession, AuthenticatedUser, UserSummary } from "../domain/AuthProvider.js";
import { DEFAULT_ROLE, type UserRole } from "../domain/UserRole.js";
import { AuthenticationError, ConflictError } from "../../../shared/domain/DomainError.js";

interface StoredUser {
  id: string;
  email: string;
  password: string;
  rol: UserRole;
  creadoEn: Date;
  suspendido: boolean;
}

/** Fake para tests — ADR-03 apartado 3.6. No sustituye a Supabase en dev (ADR-06 apartado 1). */
export class InMemoryAuthProvider implements AuthProvider {
  private readonly users: StoredUser[] = [];
  private readonly resetTokens = new Map<string, string>(); // token -> email

  async register(email: string, password: string): Promise<AuthenticatedUser> {
    if (this.users.some((u) => u.email === email)) {
      throw new ConflictError("Ya existe una cuenta con ese email");
    }
    // +length ms: altas seguidas en el mismo milisegundo siguen ordenables.
    const createdAt = new Date(Date.now() + this.users.length);
    const user: StoredUser = { id: randomUUID(), email, password, rol: DEFAULT_ROLE, creadoEn: createdAt, suspendido: false };
    this.users.push(user);
    return { id: user.id, email: user.email, rol: user.rol };
  }

  async logIn(email: string, password: string): Promise<LoggedInSession> {
    const user = this.users.find((u) => u.email === email && u.password === password);
    if (!user || user.suspendido) {
      throw new AuthenticationError("Email o contraseña incorrectos");
    }
    return { id: user.id, email: user.email, token: `fake-token:${user.id}` };
  }

  async verifySession(token: string): Promise<AuthenticatedUser> {
    const id = token.startsWith("fake-token:") ? token.slice("fake-token:".length) : undefined;
    const user = id ? this.users.find((u) => u.id === id) : undefined;
    if (!user || user.suspendido) {
      throw new AuthenticationError("Sesión no válida");
    }
    return { id: user.id, email: user.email, rol: user.rol };
  }

  async listAllUsers(): Promise<UserSummary[]> {
    return this.users.map((u) => ({ id: u.id, email: u.email, rol: u.rol, creadoEn: u.creadoEn, suspendido: u.suspendido }));
  }

  async requestPasswordReset(email: string): Promise<void> {
    // Genera el token incluso si el email no existe, para no revelar nada por el tiempo de respuesta.
    const token = randomUUID();
    if (this.users.some((u) => u.email === email)) {
      this.resetTokens.set(token, email);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const email = this.resetTokens.get(token);
    const user = email ? this.users.find((u) => u.email === email) : undefined;
    if (!user) {
      throw new AuthenticationError("El enlace de recuperación no es válido o ha caducado");
    }
    user.password = newPassword;
    this.resetTokens.delete(token);
  }

  /** Solo para tests — simula el token que en producción llega por email. */
  resetTokenForTest(email: string): string | undefined {
    for (const [token, emailAddress] of this.resetTokens) {
      if (emailAddress === email) return token;
    }
    return undefined;
  }

  /**
   * Solo para tests — simula la concesión manual de un rol (RNF-13). En
   * producción esto no tiene equivalente en la app todavía: se hace a mano
   * en el dashboard de Supabase (`app_metadata.rol`), nunca desde un
   * endpoint que el propio usuario pueda invocar.
   */
  assignRoleForTest(email: string, role: UserRole): void {
    const user = this.users.find((u) => u.email === email);
    if (user) user.rol = role;
  }

  async changeRole(id: string, role: UserRole): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) user.rol = role;
  }

  async changeEmail(id: string, email: string): Promise<void> {
    if (this.users.some((u) => u.email === email && u.id !== id)) {
      throw new ConflictError("Ya existe una cuenta con ese email");
    }
    const user = this.users.find((u) => u.id === id);
    if (user) user.email = email;
  }

  async suspend(id: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) user.suspendido = true;
  }

  async reactivate(id: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) user.suspendido = false;
  }

  async deleteUser(id: string): Promise<void> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index >= 0) this.users.splice(index, 1);
  }
}
