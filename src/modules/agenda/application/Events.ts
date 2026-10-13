import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "#shared/domain/Result.js";
import type { Clock } from "#shared/domain/Clock.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { type EventRepository, MAX_EVENTS_PER_USER, MAX_EVENT_CATEGORIES, MAX_EVENT_TITLE_LENGTH, type UserEvent, isValidEventDay } from "../domain/UserEvent.js";

export interface AddEventInput {
  userId: string;
  title: string;
  day: string;
  categoryIds?: readonly string[];
}

/** Lo que ve la interfaz: sin el usuario, que ya se sabe. */
export type EventView = Pick<UserEvent, "id" | "title" | "day" | "categoryIds">;

function toView({ id, title, day, categoryIds }: UserEvent): EventView {
  return { id, title, day, categoryIds: [...categoryIds] };
}

interface AddEventDependencies {
  eventRepository: EventRepository;
  categoryRepository: CategoryRepository;
  clock: Clock;
}

/**
 * Caso de uso — RF-48: anotar un evento propio. Las categorías, si se indican,
 * tienen que ser de la persona. No toca ninguna puntuación.
 */
export function createAddEvent({ eventRepository, categoryRepository, clock }: AddEventDependencies) {
  return async function addEvent(input: AddEventInput): Promise<Result<EventView, NotFoundError | ValidationError>> {
    const userId = input.userId.trim();
    const title = input.title.trim();
    if (title.length === 0 || title.length > MAX_EVENT_TITLE_LENGTH) return err(new ValidationError(`Title must have between 1 and ${MAX_EVENT_TITLE_LENGTH} characters`));
    const now = clock.now();
    if (!isValidEventDay(input.day, now)) return err(new ValidationError("Day must be a real date, from a year ago to two years from now"));

    const categoryIds = [...new Set((input.categoryIds ?? []).map((categoryId) => categoryId.trim()))];
    if (categoryIds.length > MAX_EVENT_CATEGORIES) return err(new ValidationError(`An event can have ${MAX_EVENT_CATEGORIES} categories at most`));
    for (const categoryId of categoryIds) {
      if (!(await categoryRepository.findById(userId, categoryId))) return err(new NotFoundError("Category not found"));
    }
    if ((await eventRepository.findByUserId(userId)).length >= MAX_EVENTS_PER_USER) return err(new ValidationError("Too many events"));

    const event: UserEvent = { id: randomUUID(), userId, title, day: input.day, categoryIds, createdAt: now };
    await eventRepository.save(event);
    return ok(toView(event));
  };
}

/** Caso de uso — RF-48: los eventos de la persona, por día. */
export function createListEvents(eventRepository: EventRepository) {
  return async function listEvents(userId: string): Promise<Result<EventView[], never>> {
    const events = await eventRepository.findByUserId(userId.trim());
    return ok([...events].sort((a, b) => a.day.localeCompare(b.day) || a.createdAt.getTime() - b.createdAt.getTime()).map(toView));
  };
}

/** Caso de uso — RF-48: borrar un evento propio. */
export function createDeleteEvent(eventRepository: EventRepository) {
  return async function deleteEvent(input: { userId: string; eventId: string }): Promise<Result<void, NotFoundError>> {
    const deleted = await eventRepository.delete(input.userId.trim(), input.eventId.trim());
    return deleted ? ok(undefined) : err(new NotFoundError("Event not found"));
  };
}
