import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { IdeaReactionKind } from "@modules/recommendations/domain/IdeaReaction";
import { getJson } from "@shared/ui/api/getJson";

/** RF-19: lo que la persona ha decidido sobre una idea (guardada, hecha o descartada). */
export interface IdeaReactionDto {
  categoryId: string;
  templateKey: string;
  reaction: IdeaReactionKind;
  reactedAt: string;
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
 */
export function useSetIdeaReaction() {
  const queryClient = useQueryClient();
  return async function setIdeaReaction(categoryId: string, templateKey: string, reaction: IdeaReactionKind | null): Promise<boolean> {
    const previous = queryClient.getQueryData<IdeaReactionDto[]>(IDEA_REACTIONS_KEY);
    const others = (Array.isArray(previous) ? previous : []).filter((item) => !(item.categoryId === categoryId && item.templateKey === templateKey));
    queryClient.setQueryData<IdeaReactionDto[]>(IDEA_REACTIONS_KEY, reaction ? [{ categoryId, templateKey, reaction, reactedAt: new Date().toISOString() }, ...others] : others);
    try {
      const response = await fetch("/api/recommendations/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId, templateKey, reaction }) });
      if (response.ok) return true;
    } catch {
      // Se trata abajo, igual que una respuesta de error.
    }
    queryClient.setQueryData<IdeaReactionDto[] | undefined>(IDEA_REACTIONS_KEY, previous);
    return false;
  };
}
