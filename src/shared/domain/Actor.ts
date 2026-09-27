import { type Result, err, ok } from "./Result.js";
import { ForbiddenError } from "./DomainError.js";

/**
 * Quien ejecuta un caso de uso, tal y como lo verificó el servidor (nunca
 * datos del cliente). Solo lo mínimo para autorizar: cada módulo recibe esto
 * sin depender del módulo de cuentas.
 */
export interface Actor {
  readonly rol: string;
}

/** Denegar por defecto: solo `admin` pasa (ADM-01/ADM-02). */
export function requireAdmin(actor: Actor): Result<void, ForbiddenError> {
  return actor.rol === "admin" ? ok(undefined) : err(new ForbiddenError("Se requiere rol de administrador"));
}
