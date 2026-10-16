import { type Result, err, ok } from "#shared/domain/Result.js";
import { AuthenticationError, DomainError } from "#shared/domain/DomainError.js";
import type { AuthenticatedUser, AuthProvider, RenewedTokens } from "../domain/AuthProvider.js";

export interface ResumeSessionInput {
  /** El token de acceso de la cookie `sesion` (dura una hora). */
  token: string | undefined;
  /** El de la cookie `sesion_renovar` (dura dos días). */
  refreshToken: string | undefined;
}

export interface ResumedSession {
  user: AuthenticatedUser;
  /** Solo si hizo falta renovar: hay que guardar estos tokens en las cookies. */
  renewed?: RenewedTokens;
}

/**
 * Caso de uso — SEC-05. Comprueba la sesión y, si el token de acceso ya no
 * vale, la renueva con el de renovación sin pedir la contraseña. La cuenta se
 * vuelve a comprobar con el token nuevo, así que una suspendida (ADM-03) no
 * sigue dentro.
 */
export function createResumeSession(authProvider: AuthProvider) {
  return async function resumeSession(input: ResumeSessionInput): Promise<Result<ResumedSession, AuthenticationError>> {
    if (input.token) {
      try {
        return ok({ user: await authProvider.verifySession(input.token) });
      } catch (error) {
        if (!(error instanceof DomainError)) throw error;
      }
    }
    if (!input.refreshToken) return err(new AuthenticationError("No hay sesión"));
    try {
      const renewed = await authProvider.refreshSession(input.refreshToken);
      return ok({ user: await authProvider.verifySession(renewed.token), renewed });
    } catch (error) {
      if (error instanceof DomainError) return err(new AuthenticationError("Sesión no válida"));
      throw error;
    }
  };
}
