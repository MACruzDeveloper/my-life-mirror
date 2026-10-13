import type { EventRepository, UserEvent } from "../domain/UserEvent.js";

/** Fake para tests — ADR-03 apartado 3.6. En desarrollo y producción, `SupabaseEventRepository`. */
export class InMemoryEventRepository implements EventRepository {
  private readonly events = new Map<string, UserEvent>();

  async findByUserId(userId: string): Promise<UserEvent[]> {
    return [...this.events.values()].filter((event) => event.userId === userId);
  }

  async save(event: UserEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async delete(userId: string, eventId: string): Promise<boolean> {
    if (this.events.get(eventId)?.userId !== userId) return false;
    return this.events.delete(eventId);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, event] of this.events) {
      if (event.userId === userId) this.events.delete(id);
    }
  }
}
