import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { ValidationError } from "../../../shared/domain/DomainError.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Value Object — inmutable, se valida a sí mismo en `crear` (ADR-03 apartado 3.2). */
export class Email {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<Email, ValidationError> {
    const normalized = value.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      return err(new ValidationError("El formato del email no es válido"));
    }
    return ok(new Email(normalized));
  }
}
