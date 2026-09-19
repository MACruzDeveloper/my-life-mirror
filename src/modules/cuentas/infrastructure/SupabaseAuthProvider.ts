import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthProvider, SesionIniciada, UsuarioAutenticado } from "../domain/AuthProvider";
import { ROL_POR_DEFECTO, leerRolDesdeMetadata } from "../domain/RolUsuario";
import { AuthenticationError, ConflictError, ValidationError } from "../../../shared/domain/DomainError";

/**
 * Adaptador real — ADR-06. Usa la service role key (solo en `api/`, nunca en
 * el navegador). Sin test propio: no hay lógica que probar más allá del SDK
 * de Supabase (mismo criterio que se aplicó a BcryptPasswordHasher).
 */
export class SupabaseAuthProvider implements AuthProvider {
  private readonly cliente: SupabaseClient;
  private readonly urlRestablecerPassword: string;

  constructor(url: string, serviceRoleKey: string, urlRestablecerPassword: string) {
    this.cliente = createClient(url, serviceRoleKey);
    this.urlRestablecerPassword = urlRestablecerPassword;
  }

  async registrar(email: string, password: string): Promise<UsuarioAutenticado> {
    const { data, error } = await this.cliente.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // sin confirmación por email en el Ciclo 1 — ver ADR-06 §1
      // Rol explícito desde el alta (RNF-13) — nadie se autorregistra como
      // premium/admin; esos roles se conceden a mano después, vía dashboard.
      app_metadata: { rol: ROL_POR_DEFECTO },
    });

    if (error) {
      if (error.status === 422 || error.message.toLowerCase().includes("already been registered")) {
        throw new ConflictError("Ya existe una cuenta con ese email");
      }
      throw new ValidationError(error.message);
    }

    return { id: data.user.id, email: data.user.email ?? email, rol: leerRolDesdeMetadata(data.user.app_metadata) };
  }

  async iniciarSesion(email: string, password: string): Promise<SesionIniciada> {
    const { data, error } = await this.cliente.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      throw new AuthenticationError("Email o contraseña incorrectos");
    }

    return {
      id: data.user.id,
      email: data.user.email ?? email,
      token: data.session.access_token,
    };
  }

  async verificarSesion(token: string): Promise<UsuarioAutenticado> {
    const { data, error } = await this.cliente.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthenticationError("Sesión no válida");
    }
    return { id: data.user.id, email: data.user.email ?? "", rol: leerRolDesdeMetadata(data.user.app_metadata) };
  }

  async solicitarRecuperacion(email: string): Promise<void> {
    // Se ignora el error deliberadamente (RF-38): nunca se revela si el email existe.
    await this.cliente.auth.resetPasswordForEmail(email, {
      redirectTo: this.urlRestablecerPassword,
    });
  }

  async restablecerPassword(token: string, nuevaPassword: string): Promise<void> {
    const { data, error } = await this.cliente.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthenticationError("El enlace de recuperación no es válido o ha caducado");
    }

    const { error: errorActualizar } = await this.cliente.auth.admin.updateUserById(data.user.id, {
      password: nuevaPassword,
    });
    if (errorActualizar) {
      throw new AuthenticationError("El enlace de recuperación no es válido o ha caducado");
    }
  }
}
