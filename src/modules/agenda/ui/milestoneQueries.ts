import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";
import { byNewestTrip } from "@modules/agenda/domain/Trip";
import type { MilestoneCategory } from "@modules/agenda/domain/Milestone";

/** RF-49: un hito, como lo ve la pantalla. */
export interface MilestoneDto {
  id: string;
  categoryKey: MilestoneCategory;
  title: string;
  year: number;
  /** De 1 a 12, si se indicó. */
  month?: number;
}

/** Fuera de `["assessments"]`: un hito no cambia ninguna puntuación. Una caché por página; cada cambio la actualiza a mano. */
export const milestonesKey = (categoryKey: MilestoneCategory) => ["agenda", "milestones", categoryKey] as const;

export function useMilestones(categoryKey: MilestoneCategory) {
  return useQuery({ queryKey: milestonesKey(categoryKey), queryFn: ({ signal }) => getJson<MilestoneDto[]>(`/api/agenda/milestones?category=${categoryKey}`, signal) });
}

/** Añadir y borrar: la caché se actualiza con la respuesta del servidor, sin volver a pedir la lista. */
export function useMilestoneActions(categoryKey: MilestoneCategory) {
  const queryClient = useQueryClient();
  const key = milestonesKey(categoryKey);

  async function addMilestone(input: Omit<MilestoneDto, "id" | "categoryKey">): Promise<boolean> {
    try {
      const response = await fetch("/api/agenda/milestones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryKey, ...input }) });
      if (!response.ok) return false;
      const created = (await response.json()) as MilestoneDto;
      queryClient.setQueryData<MilestoneDto[]>(key, (current) => [...(current ?? []), created].sort(byNewestTrip));
      return true;
    } catch {
      return false;
    }
  }

  async function deleteMilestone(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/agenda/milestones?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) return false;
      queryClient.setQueryData<MilestoneDto[]>(key, (current) => current?.filter((milestone) => milestone.id !== id));
      return true;
    } catch {
      return false;
    }
  }

  return { addMilestone, deleteMilestone };
}
