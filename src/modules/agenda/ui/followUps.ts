import { dayFromToday } from "@modules/recommendations/ui/planDates";
import type { EventDto } from "./calendarMonth";

/** Hasta cuántos días después de un evento se invita a revisar la nota. */
export const FOLLOW_UP_DAYS = 14;
// Preferencia de este navegador (como la guía de Inicio): las invitaciones que ya se cerraron.
const DISMISSED_KEY = "mlm.eventFollowUpsDismissed";

/** Las invitaciones que la persona cerró en este navegador. */
export function readDismissedFollowUps(): string[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(DISMISSED_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveDismissedFollowUps(ids: string[]) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(-50)));
  } catch {
    // No es crítico: la invitación volverá a salir en la próxima visita.
  }
}

/**
 * RF-48: los eventos que piden revisar la nota: con alguna categoría que siga
 * existiendo, desde su día y durante 14 días, y sin cerrar. La nota nunca
 * cambia sola: solo se invita.
 */
export function pendingFollowUps(events: readonly EventDto[], categoryNames: Record<string, string>, dismissed: readonly string[], now: Date = new Date()): { event: EventDto; categories: string[] }[] {
  const today = dayFromToday(0, now);
  const firstDay = dayFromToday(-FOLLOW_UP_DAYS, now);
  return events.flatMap((event) => {
    const categories = (event.categoryIds ?? []).flatMap((categoryId) => categoryNames[categoryId] ?? []);
    return categories.length > 0 && event.day <= today && event.day >= firstDay && !dismissed.includes(event.id) ? [{ event, categories }] : [];
  });
}
