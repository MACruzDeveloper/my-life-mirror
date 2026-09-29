import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { ValidationError } from "../../../shared/domain/DomainError.js";

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;

/** Value Object — RF-10. Inmutable y se valida a sí mismo en `create` (ADR-03 apartado 3.2). */
export class Score {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Result<Score, ValidationError> {
    if (!Number.isInteger(value) || value < MIN_SCORE || value > MAX_SCORE) {
      return err(new ValidationError(`Score must be a whole number between ${MIN_SCORE} and ${MAX_SCORE}`));
    }
    return ok(new Score(value));
  }
}
