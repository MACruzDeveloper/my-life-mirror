/**
 * Jerarquía tipada de excepciones de dominio — ADR-03 apartado 3.2.
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

export class AuthenticationError extends DomainError {
  readonly code = "AUTHENTICATION_ERROR";
}

/**
 * Respuesta de negocio esperable, no un dato mal formado — RF-04/RF-07:
 * activar una categoría sensible sin consentimiento otorgado todavía. El
 * frontend la distingue por `code` para mostrar el modal de consentimiento
 * en vez de un error genérico (docs/user-stories/RF-06-RF-07-categorias.md).
 */
export class ConsentRequiredError extends DomainError {
  readonly code = "CONSENT_REQUIRED";
}

/**
 * Sesión válida pero sin permiso para la acción (ADM-01) — distinta de
 * AuthenticationError ("no sé quién eres"): aquí sí se sabe, y no basta el rol.
 */
export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
}
