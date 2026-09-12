/**
 * Jerarquía tipada de excepciones de dominio — ADR-03 §3.2.
 * Distingue error de negocio (estos) de error técnico (excepciones nativas
 * de infraestructura, que nunca deberían cruzar hacia el dominio/aplicación).
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
}
