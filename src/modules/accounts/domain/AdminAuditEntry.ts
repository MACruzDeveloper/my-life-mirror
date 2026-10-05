/**
 * ADM-03 — anotación de auditoría de una acción de administración. Sirve para
 * responder "quién hizo qué, cuándo y sobre qué cuenta". Deliberadamente sin
 * datos personales ni contenido de usuarios: solo ids, la acción y un detalle
 * corto no sensible (p. ej. "usuario->premium"). Nunca contraseñas ni emails,
 * para no contradecir el derecho al olvido (RF-05).
 */
export interface AdminAuditEntry {
  readonly id: string;
  readonly actorId: string;
  readonly action: string;
  readonly targetId?: string;
  readonly detail?: string;
  readonly occurredAt: Date;
}
