import { randomUUID } from "node:crypto";
import type { AuthProvider, SesionIniciada, UsuarioAutenticado, UsuarioResumen } from "../domain/AuthProvider.js";
import { ROL_POR_DEFECTO, type RolUsuario } from "../domain/RolUsuario.js";
import { AuthenticationError, ConflictError } from "../../../shared/domain/DomainError.js";

interface RegistroInterno {
  id: string;
  email: string;
  password: string;
  rol: RolUsuario;
  creadoEn: Date;
  suspendido: boolean;
}

/** Fake para tests — ADR-03 §3.6. No sustituye a Supabase en dev (ADR-06 §1). */
export class InMemoryAuthProvider implements AuthProvider {
  private readonly usuarios: RegistroInterno[] = [];
  private readonly tokensDeRecuperacion = new Map<string, string>(); // token -> email

  async registrar(email: string, password: string): Promise<UsuarioAutenticado> {
    if (this.usuarios.some((u) => u.email === email)) {
      throw new ConflictError("Ya existe una cuenta con ese email");
    }
    // +length ms: altas seguidas en el mismo milisegundo siguen ordenables.
    const creadoEn = new Date(Date.now() + this.usuarios.length);
    const usuario: RegistroInterno = { id: randomUUID(), email, password, rol: ROL_POR_DEFECTO, creadoEn, suspendido: false };
    this.usuarios.push(usuario);
    return { id: usuario.id, email: usuario.email, rol: usuario.rol };
  }

  async iniciarSesion(email: string, password: string): Promise<SesionIniciada> {
    const usuario = this.usuarios.find((u) => u.email === email && u.password === password);
    if (!usuario || usuario.suspendido) {
      throw new AuthenticationError("Email o contraseña incorrectos");
    }
    return { id: usuario.id, email: usuario.email, token: `fake-token:${usuario.id}` };
  }

  async verificarSesion(token: string): Promise<UsuarioAutenticado> {
    const id = token.startsWith("fake-token:") ? token.slice("fake-token:".length) : undefined;
    const usuario = id ? this.usuarios.find((u) => u.id === id) : undefined;
    if (!usuario || usuario.suspendido) {
      throw new AuthenticationError("Sesión no válida");
    }
    return { id: usuario.id, email: usuario.email, rol: usuario.rol };
  }

  async listarUsuarios(): Promise<UsuarioResumen[]> {
    return this.usuarios.map((u) => ({ id: u.id, email: u.email, rol: u.rol, creadoEn: u.creadoEn, suspendido: u.suspendido }));
  }

  async solicitarRecuperacion(email: string): Promise<void> {
    // Genera el token incluso si el email no existe, para no revelar nada por el tiempo de respuesta.
    const token = randomUUID();
    if (this.usuarios.some((u) => u.email === email)) {
      this.tokensDeRecuperacion.set(token, email);
    }
  }

  async restablecerPassword(token: string, nuevaPassword: string): Promise<void> {
    const email = this.tokensDeRecuperacion.get(token);
    const usuario = email ? this.usuarios.find((u) => u.email === email) : undefined;
    if (!usuario) {
      throw new AuthenticationError("El enlace de recuperación no es válido o ha caducado");
    }
    usuario.password = nuevaPassword;
    this.tokensDeRecuperacion.delete(token);
  }

  /** Solo para tests — simula el token que en producción llega por email. */
  tokenDeRecuperacionParaTest(email: string): string | undefined {
    for (const [token, correo] of this.tokensDeRecuperacion) {
      if (correo === email) return token;
    }
    return undefined;
  }

  /**
   * Solo para tests — simula la concesión manual de un rol (RNF-13). En
   * producción esto no tiene equivalente en la app todavía: se hace a mano
   * en el dashboard de Supabase (`app_metadata.rol`), nunca desde un
   * endpoint que el propio usuario pueda invocar.
   */
  asignarRolParaTest(email: string, rol: RolUsuario): void {
    const usuario = this.usuarios.find((u) => u.email === email);
    if (usuario) usuario.rol = rol;
  }

  async cambiarRol(id: string, rol: RolUsuario): Promise<void> {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) usuario.rol = rol;
  }

  async actualizarEmail(id: string, email: string): Promise<void> {
    if (this.usuarios.some((u) => u.email === email && u.id !== id)) {
      throw new ConflictError("Ya existe una cuenta con ese email");
    }
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) usuario.email = email;
  }

  async suspender(id: string): Promise<void> {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) usuario.suspendido = true;
  }

  async reactivar(id: string): Promise<void> {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) usuario.suspendido = false;
  }

  async eliminarUsuario(id: string): Promise<void> {
    const indice = this.usuarios.findIndex((u) => u.id === id);
    if (indice >= 0) this.usuarios.splice(indice, 1);
  }
}
