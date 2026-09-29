import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { ValidationError } from "../../../shared/domain/DomainError.js";

const MIN_LENGTH = 8;

/** Value Object sobre la contraseña en claro — RF-01. El hash es responsabilidad de PasswordHasher, no de este VO. */
export class Password {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<Password, ValidationError> {
    if (value.length < MIN_LENGTH) {
      return err(new ValidationError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres`));
    }
    return ok(new Password(value));
  }
}
