import { type Result, err, ok } from "#shared/domain/Result.js";
import { DomainError } from "#shared/domain/DomainError.js";
import { type PasswordContext, type PasswordRule, checkPassword } from "./passwordPolicy.js";

/**
 * Una contraseña nueva que no cumple la política (SEC-01). Lleva los
 * requisitos que fallan para que el formulario de registro los explique uno a
 * uno. Nunca sale del inicio de sesión: ahí no se da ninguna pista.
 */
export class WeakPasswordError extends DomainError {
  readonly code = "WEAK_PASSWORD";
  readonly rules: readonly PasswordRule[];

  constructor(rules: readonly PasswordRule[]) {
    super("La contraseña no cumple los requisitos");
    this.rules = rules;
  }
}

/**
 * Value Object sobre una contraseña NUEVA en claro (registro, RF-01; cambio,
 * RF-38). La política está en `passwordPolicy.ts`; guardarla cifrada es cosa
 * del proveedor de autenticación (ADR-06), no de este objeto.
 */
export class Password {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string, context: PasswordContext = {}): Result<Password, WeakPasswordError> {
    const failedRules = checkPassword(value, context);
    if (failedRules.length > 0) return err(new WeakPasswordError(failedRules));
    return ok(new Password(value));
  }
}

const GENERATED_LENGTH = 16;
// Sin caracteres que se confunden al copiarlos a mano (0/O, 1/l/I).
const GENERATED_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_.#%+";

function randomCharacter(): string {
  // Se descartan los bytes que sesgarían el reparto (256 no es múltiplo del alfabeto).
  const limit = 256 - (256 % GENERATED_ALPHABET.length);
  const byte = new Uint8Array(1);
  do globalThis.crypto.getRandomValues(byte);
  while (byte[0] >= limit);
  return GENERATED_ALPHABET[byte[0] % GENERATED_ALPHABET.length];
}

/**
 * Una contraseña aleatoria que cumple la política: la temporal que la
 * administración entrega al crear un usuario (ADM-03). Aleatoriedad
 * criptográfica; se repite el sorteo hasta que salga una con todos los tipos
 * de caracteres, sin secuencias y sin nada del `context`.
 */
export function generatePassword(context: PasswordContext = {}): string {
  for (;;) {
    const candidate = Array.from({ length: GENERATED_LENGTH }, randomCharacter).join("");
    if (checkPassword(candidate, context).length === 0) return candidate;
  }
}
