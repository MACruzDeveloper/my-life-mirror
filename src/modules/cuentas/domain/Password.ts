import { type Result, err, ok } from "../../../shared/domain/Result";
import { ValidationError } from "../../../shared/domain/DomainError";

const LONGITUD_MINIMA = 8;

/** Value Object sobre la contraseña en claro — RF-01. El hash es responsabilidad de PasswordHasher, no de este VO. */
export class Password {
  readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
  }

  static crear(valor: string): Result<Password, ValidationError> {
    if (valor.length < LONGITUD_MINIMA) {
      return err(new ValidationError(`La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres`));
    }
    return ok(new Password(valor));
  }
}
