import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { IdeaReactionKind } from "@modules/recommendations/domain/IdeaReaction";
import { getJson } from "@shared/ui/api/getJson";

/** RF-19: lo que la persona ha decidido sobre una idea (guardada, hecha o descartada). */
export interface IdeaReactionDto {
  categoryId: string;
  templateKey: string;
  reaction: IdeaReactionKind;
  reactedAt: string;
  /** RF-47: día orientativo ("AAAA-MM-DD") de una idea guardada. */
  plannedFor?: string;
}

/** Fuera de `["assessments"]`: guardar puntuaciones no cambia las reacciones. Cada cambio actualiza esta caché a mano. */
export const IDEA_REACTIONS_KEY = ["idea-reactions"] as const;

export function useIdeaReactions(enabled = true) {
  return useQuery({ queryKey: IDEA_REACTIONS_KEY, enabled, queryFn: ({ signal }) => getJson<IdeaReactionDto[]>("/api/recommendations/reactions", signal) });
}

/** Las ideas del carrusel de una categoría, sin las que la persona descartó ahí. */
export function visibleIdeaKeys(keys: readonly string[], reactions: readonly IdeaReactionDto[], categoryId: string | undefined): string[] {
  if (!categoryId) return [...keys];
  const discarded = new Set(reactions.filter((reaction) => reaction.categoryId === categoryId && reaction.reaction === "discarded").map((reaction) => reaction.templateKey));
  return keys.filter((key) => !discarded.has(key));
}

/**
 * Fija o quita (`null`) la reacción a una idea. Optimista: la caché cambia al
 * momento y, si el servidor no lo acepta, vuelve a como estaba.
 * RF-47: `plannedFor` pone (o con `null` quita) la fecha de una idea guardada;
 * sin indicarlo, se conserva la que tuviera.
 */
export function useSetIdeaReaction() {
  const queryClient = useQueryClient();
  return async function setIdeaReaction(categoryId: string, templateKey: string, reaction: IdeaReactionKind | null, plannedFor?: string | null): Promise<boolean> {
    const previous = queryClient.getQueryData<IdeaReactionDto[]>(IDEA_REACTIONS_KEY);
    const list = Array.isArray(previous) ? previous : [];
    const isSame = (item: IdeaReactionDto) => item.categoryId === categoryId && item.templateKey === templateKey;
    const current = list.find(isSame);
    const stillSaved = reaction === "saved" && current?.reaction === "saved" ? current : undefined;
    const date = reaction === "saved" ? (plannedFor === undefined ? stillSaved?.plannedFor : (plannedFor ?? undefined)) : undefined;
    const next: IdeaReactionDto | undefined = reaction ? { categoryId, templateKey, reaction, reactedAt: stillSaved?.reactedAt ?? new Date().toISOString(), ...(date ? { plannedFor: date } : {}) } : undefined;
    // Una ya guardada se queda en su sitio (solo cambia su fecha); una nueva, arriba.
    queryClient.setQueryData<IdeaReactionDto[]>(IDEA_REACTIONS_KEY, stillSaved && next ? list.map((item) => (isSame(item) ? next : item)) : [...(next ? [next] : []), ...list.filter((item) => !isSame(item))]);
    try {
      const response = await fetch("/api/recommendations/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId, templateKey, reaction, ...(plannedFor !== undefined ? { plannedFor } : {}) }) });
      if (response.ok) return true;
    } catch {
      // Se trata abajo, igual que una respuesta de error.
    }
    queryClient.setQueryData<IdeaReactionDto[] | undefined>(IDEA_REACTIONS_KEY, previous);
    return false;
  };
}
