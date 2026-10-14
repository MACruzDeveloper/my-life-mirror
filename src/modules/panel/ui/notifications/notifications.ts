import type { EventDto } from "@modules/agenda/ui/calendarMonth";
import { pendingFollowUps } from "@modules/agenda/ui/followUps";
import type { IdeaReactionDto } from "@modules/recommendations/ui/ideaReactions";
import { dayFromToday } from "@modules/recommendations/ui/planDates";
import { type ScoredCategory, staleCategories } from "../home/staleCategories";

/**
 * Un aviso de la campana. Todos son avisos que la app ya daba en Inicio,
 * reunidos en un sitio; ninguno sale de la app (sin correo ni notificaciones
 * del sistema, RF-22 sigue fuera de alcance). `id` es estable: sirve para
 * saber cuáles ya se vieron.
 */
export type AppNotification =
  | { kind: "event"; id: string; title: string; categories: string[]; link: string }
  | { kind: "idea"; id: string; category: string; day: string; link: string }
  | { kind: "stale"; id: string; category: string; weeks: number; link: string };

interface NotificationSources {
  now: Date;
  /** Nombre de cada categoría por id, en el idioma de la interfaz. */
  categoryNames: Record<string, string>;
  events: readonly EventDto[];
  /** Las invitaciones de eventos que ya se cerraron en Inicio. */
  dismissedFollowUps: readonly string[];
  reactions: readonly IdeaReactionDto[];
  latestScores: readonly ScoredCategory[];
}

/**
 * Los avisos, en este orden: revisar la nota tras un evento (RF-48), ideas
 * guardadas cuya fecha ha llegado (RF-47) y categorías sin revisar desde hace
 * más de un mes (UX-10).
 */
export function buildNotifications({ now, categoryNames, events, dismissedFollowUps, reactions, latestScores }: NotificationSources): AppNotification[] {
  const today = dayFromToday(0, now);
  const afterEvents: AppNotification[] = pendingFollowUps(events, categoryNames, dismissedFollowUps, now).map(({ event, categories }) => ({ kind: "event", id: `event:${event.id}`, title: event.title, categories, link: "/perfil/entrevista" }));
  const dueIdeas: AppNotification[] = reactions
    .filter((reaction) => reaction.reaction === "saved" && reaction.plannedFor !== undefined && reaction.plannedFor <= today)
    .map((reaction) => ({ kind: "idea", id: `idea:${reaction.categoryId}:${reaction.templateKey}`, category: categoryNames[reaction.categoryId] ?? "", day: reaction.plannedFor!, link: "/inicio" }));
  const stale: AppNotification[] = staleCategories(latestScores, now).map((category) => {
    const recordedAt = latestScores.find((latest) => latest.categoryId === category.categoryId)?.recordedAt ?? "";
    // Con la fecha de la nota en el id: si se vuelve a puntuar y vuelve a pasar un mes, es un aviso nuevo.
    return { kind: "stale", id: `stale:${category.categoryId}:${recordedAt}`, category: category.categoryName, weeks: category.weeks, link: "/perfil/entrevista" };
  });
  return [...afterEvents, ...dueIdeas, ...stale];
}
