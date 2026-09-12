/**
 * Contrato base de evento de dominio — ADR-03 §3.2/§3.4.
 * Lo emite únicamente el Aggregate Root de cada módulo, y solo se publica
 * (vía patrón Outbox) después de que la persistencia esté confirmada.
 */
export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}
