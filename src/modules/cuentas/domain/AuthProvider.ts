import type { RolUsuario } from "./RolUsuario.js";

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
  /** Bloqueada por un administrador: no puede iniciar sesión ni usar una sesión abierta (ADM-03). */
  readonly suspendido: boolean;
}

export interface AuthProvider {
  registrar(email: string, password: string): Promise<UsuarioAutenticado>;
  iniciarSesion(email: string, password: string): Promise<SesionIniciada>;
  /** Valida un token de sesión ya emitido — lanza AuthenticationError si no es válido. */
  verificarSesion(token: string): Promise<UsuarioAutenticado>;
  /** Todos los usuarios registrados. Quien lo llama debe haber comprobado ya que es admin (ver ListUsers). */
  listarUsuarios(): Promise<UsuarioResumen[]>;
  /** Cambia el rol (ADM-03). Quien lo llama debe haber comprobado que es admin y las reglas del último admin. */
  cambiarRol(id: string, rol: RolUsuario): Promise<void>;
  /** Cambia el email de acceso (ADM-03). Lanza ConflictError si ya está en uso. */
  actualizarEmail(id: string, email: string): Promise<void>;
  /** Bloquea / desbloquea la cuenta sin borrar nada (ADM-03). */
  suspender(id: string): Promise<void>;
  reactivar(id: string): Promise<void>;
  /** Elimina la cuenta de acceso (RF-05). Repetible: no falla si ya no existe. */
  eliminarUsuario(id: string): Promise<void>;
  /** Nunca revela si el email existe (RF-38) — siempre resuelve, no lanza por email desconocido. */
  solicitarRecuperacion(email: string): Promise<void>;
  /** Lanza AuthenticationError si el token de recuperación no es válido. */
  restablecerPassword(token: string, nuevaPassword: string): Promise<void>;
}
