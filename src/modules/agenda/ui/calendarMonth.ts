import type { IdeaReactionDto } from "@modules/recommendations/ui/ideaReactions";

/** RF-48: lo que la pantalla necesita de un evento. */
export interface EventDto {
  id: string;
  title: string;
  /** Día sin hora, "AAAA-MM-DD". */
  day: string;
  /** Categorías con las que tiene que ver (puede venir vacío). */
  categoryIds?: string[];
}

export interface YearMonth {
  year: number;
  /** De 1 (enero) a 12. */
  month: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Las semanas de un mes, de lunes a domingo: cada una con sus siete huecos, el
 * día ("AAAA-MM-DD") o `null` donde la semana pisa otro mes.
 */
export function monthWeeks(year: number, month: number): (string | null)[][] {
  const daysInMonth = new Date(year, month, 0).getDate();
  // getDay(): 0 = domingo. Se pasa a 0 = lunes.
  const leading = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const cells: (string | null)[] = [...Array<null>(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => `${year}-${pad(month)}-${pad(index + 1)}`)];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

export function shiftMonth({ year, month }: YearMonth, step: number): YearMonth {
  const date = new Date(year, month - 1 + step, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function monthOf(isoDay: string): YearMonth {
  const [year, month] = isoDay.split("-").map(Number);
  return { year, month };
}

/** Un día como fecha local (para darle formato en el idioma de la interfaz). */
export function localDate(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Lo que cabe en un día del calendario: un evento propio o una idea guardada con fecha (RF-47). */
export type AgendaItem = { kind: "event"; day: string; event: EventDto } | { kind: "idea"; day: string; idea: IdeaReactionDto };

/** Eventos e ideas guardadas con fecha, juntos y por día. */
export function agendaItems(events: readonly EventDto[], reactions: readonly IdeaReactionDto[]): AgendaItem[] {
  const ideas: AgendaItem[] = reactions.flatMap((idea) => (idea.reaction === "saved" && idea.plannedFor ? [{ kind: "idea" as const, day: idea.plannedFor, idea }] : []));
  // Solo eventos con su día: una respuesta inesperada del servidor no rompe la pantalla.
  const dated = events.filter((event) => typeof event.day === "string");
  return [...dated.map((event): AgendaItem => ({ kind: "event", day: event.day, event })), ...ideas].sort((a, b) => a.day.localeCompare(b.day));
}
