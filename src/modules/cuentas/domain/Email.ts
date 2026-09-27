import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { ValidationError } from "../../../shared/domain/DomainError.js";

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Value Object — inmutable, se valida a sí mismo en `crear` (ADR-03 §3.2). */
export class Email {
  readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
  }

  static crear(valor: string): Result<Email, ValidationError> {
    const normalizado = valor.trim().toLowerCase();
    if (!PATRON_EMAIL.test(normalizado)) {
      return err(new ValidationError("El formato del email no es válido"));
    }
    return ok(new Email(normalizado));
  }
}
