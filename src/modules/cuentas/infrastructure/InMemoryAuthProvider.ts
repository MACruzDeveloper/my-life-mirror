import { randomUUID } from "node:crypto";
import type { AuthProvider, SesionIniciada, UsuarioAutenticado } from "../domain/AuthProvider";
import { AuthenticationError, ConflictError } from "../../../shared/domain/DomainError";

interface RegistroInterno {
  id: string;
  email: string;
  password: string;
}

/** Fake para tests — ADR-03 §3.6. No sustituye a Supabase en dev (ADR-06 §1). */
export class InMemoryAuthProvider implements AuthProvider {
  private readonly usuarios: RegistroInterno[] = [];
  private readonly tokensDeRecuperacion = new Map<string, string>(); // token -> email

  async registrar(email: string, password: string): Promise<UsuarioAutenticado> {
    if (this.usuarios.some((u) => u.email === email)) {
      throw new ConflictError("Ya existe una cuenta con ese email");
    }
    const usuario: RegistroInterno = { id: randomUUID(), email, password };
    this.usuarios.push(usuario);
    return { id: usuario.id, email: usuario.email };
  }

  async iniciarSesion(email: string, password: string): Promise<SesionIniciada> {
    const usuario = this.usuarios.find((u) => u.email === email && u.password === password);
    if (!usuario) {
      throw new AuthenticationError("Email o contraseña incorrectos");
    }
    return { id: usuario.id, email: usuario.email, token: `fake-token:${usuario.id}` };
  }

  async verificarSesion(token: string): Promise<UsuarioAutenticado> {
    const id = token.startsWith("fake-token:") ? token.slice("fake-token:".length) : undefined;
    const usuario = id ? this.usuarios.find((u) => u.id === id) : undefined;
    if (!usuario) {
      throw new AuthenticationError("Sesión no válida");
    }
    return { id: usuario.id, email: usuario.email };
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
}
