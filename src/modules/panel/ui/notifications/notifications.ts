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
  | { kind: "stale"; id: string; category: string; weeks: number; link: string }
  | { kind: "profile"; id: string; link: string };

/** Lo que mira el aviso de completar el perfil; `null`, todavía sin perfil; `undefined`, aún no ha llegado. */
type ProfileSummary = { avatarKey?: string; occupation?: string; hobbies?: readonly string[] } | null | undefined;

interface NotificationSources {
  now: Date;
  /** Nombre de cada categoría por id, en el idioma de la interfaz. */
  categoryNames: Record<string, string>;
  events: readonly EventDto[];
  /** Las invitaciones de eventos que ya se cerraron en Inicio. */
  dismissedFollowUps: readonly string[];
  reactions: readonly IdeaReactionDto[];
  latestScores: readonly ScoredCategory[];
  profile?: ProfileSummary;
}

/** Sin avatar, profesión ni aficiones: lo que hace la app más suya (y las ideas, más a su medida) está sin descubrir. */
function isProfileBare(profile: ProfileSummary): boolean {
  if (profile === undefined) return false;
  return !profile?.avatarKey && !profile?.occupation && (profile?.hobbies ?? []).length === 0;
}

/**
 * Los avisos, en este orden: completar el perfil (si no tiene avatar,
 * profesión ni aficiones), revisar la nota tras un evento (RF-48), ideas
 * guardadas cuya fecha ha llegado (RF-47) y categorías sin revisar desde hace
 * más de un mes (UX-10).
 */
export function buildNotifications({ now, categoryNames, events, dismissedFollowUps, reactions, latestScores, profile }: NotificationSources): AppNotification[] {
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
  const completeProfile: AppNotification[] = isProfileBare(profile) ? [{ kind: "profile", id: "profile:complete", link: "/perfil" }] : [];
  return [...completeProfile, ...afterEvents, ...dueIdeas, ...stale];
}
