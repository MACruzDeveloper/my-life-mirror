import type { RolUsuario } from "./RolUsuario";

/**
 * Puerto — ADR-06. El dominio no sabe que detrás hay Supabase; solo pide
 * "registrar" o "iniciar sesión". Lanza ConflictError/ValidationError/
 * AuthenticationError (shared/domain/DomainError) según corresponda.
 */
export interface SesionIniciada {
  readonly id: string;
  readonly email: string;
  readonly token: string;
}

export interface UsuarioAutenticado {
  readonly id: string;
  readonly email: string;
  readonly rol: RolUsuario;
}

/** Vista de un usuario para el panel de administración (ADM-01): sin credenciales ni datos de contenido. */
export interface UsuarioResumen {
  readonly id: string;
  readonly email: string;
  readonly rol: RolUsuario;
  readonly creadoEn: Date;
  readonly ultimoAcceso?: Date;
}

export interface AuthProvider {
  registrar(email: string, password: string): Promise<UsuarioAutenticado>;
  iniciarSesion(email: string, password: string): Promise<SesionIniciada>;
  /** Valida un token de sesión ya emitido — lanza AuthenticationError si no es válido. */
  verificarSesion(token: string): Promise<UsuarioAutenticado>;
  /** Todos los usuarios registrados. Quien lo llama debe haber comprobado ya que es admin (ver ListUsers). */
  listarUsuarios(): Promise<UsuarioResumen[]>;
  /** Nunca revela si el email existe (RF-38) — siempre resuelve, no lanza por email desconocido. */
  solicitarRecuperacion(email: string): Promise<void>;
  /** Lanza AuthenticationError si el token de recuperación no es válido. */
  restablecerPassword(token: string, nuevaPassword: string): Promise<void>;
}
