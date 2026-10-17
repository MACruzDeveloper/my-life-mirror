import type { UserRole } from "./UserRole.js";

/**
 * Puerto — ADR-06. El dominio no sabe que detrás hay Supabase; solo pide
 * "registrar" o "iniciar sesión". Lanza ConflictError/ValidationError/
 * AuthenticationError (shared/domain/DomainError) según corresponda.
 */
export interface LoggedInSession {
  readonly id: string;
  readonly email: string;
  readonly token: string;
  /** SEC-05: para pedir un token nuevo cuando el de acceso caduca (una hora), sin volver a pedir la contraseña. */
  readonly refreshToken: string;
}

/** SEC-05: el par de tokens que entrega una renovación (el de renovación también cambia: el viejo deja de valer). */
export interface RenewedTokens {
  readonly token: string;
  readonly refreshToken: string;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly rol: UserRole;
}

/** Vista de un usuario para el panel de administración (ADM-01): sin credenciales ni datos de contenido. */
export interface UserSummary {
  readonly id: string;
  readonly email: string;
  readonly rol: UserRole;
  readonly creadoEn: Date;
  readonly ultimoAcceso?: Date;
  /** Bloqueada por un administrador: no puede iniciar sesión ni usar una sesión abierta (ADM-03). */
  readonly suspendido: boolean;
}

export interface AuthProvider {
  register(email: string, password: string): Promise<AuthenticatedUser>;
  logIn(email: string, password: string): Promise<LoggedInSession>;
  /** Valida un token de sesión ya emitido — lanza AuthenticationError si no es válido. */
  verifySession(token: string): Promise<AuthenticatedUser>;
  /** SEC-05: tokens nuevos a partir del de renovación — lanza AuthenticationError si no es válido o ya se usó. */
  refreshSession(refreshToken: string): Promise<RenewedTokens>;
  /** Todos los usuarios registrados. Quien lo llama debe haber comprobado ya que es admin (ver ListUsers). */
  listAllUsers(): Promise<UserSummary[]>;
  /** Cambia el rol (ADM-03). Quien lo llama debe haber comprobado que es admin y las reglas del último admin. */
  changeRole(id: string, role: UserRole): Promise<void>;
  /** Cambia el email de acceso (ADM-03). Lanza ConflictError si ya está en uso. */
  changeEmail(id: string, email: string): Promise<void>;
  /** Bloquea / desbloquea la cuenta sin borrar nada (ADM-03). */
  suspend(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  /** Elimina la cuenta de acceso (RF-05). Repetible: no falla si ya no existe. */
  deleteUser(id: string): Promise<void>;
  /** Nunca revela si el email existe (RF-38) — siempre resuelve, no lanza por email desconocido. */
  requestPasswordReset(email: string): Promise<void>;
  /** Lanza AuthenticationError si el token de recuperación no es válido. */
  resetPassword(token: string, newPassword: string): Promise<void>;
}
