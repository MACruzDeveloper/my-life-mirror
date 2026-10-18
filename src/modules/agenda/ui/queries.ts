import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";
import type { EventDto } from "./calendarMonth";

/** Fuera de `["assessments"]`: un evento no cambia ninguna puntuación. Cada cambio actualiza esta caché a mano. */
export const EVENTS_KEY = ["agenda", "events"] as const;

/** RF-48: los eventos propios, por día. El calendario e Inicio comparten esta caché. */
export function useEvents() {
  return useQuery({ queryKey: EVENTS_KEY, queryFn: ({ signal }) => getJson<EventDto[]>("/api/agenda/events", signal) });
}

/** Añadir y borrar: la caché se actualiza con la respuesta del servidor, sin volver a pedir la lista. */
export function useEventActions() {
  const queryClient = useQueryClient();

  async function addEvent(input: { title: string; day: string; categoryIds: string[] }): Promise<boolean> {
    try {
      const response = await fetch("/api/agenda/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) return false;
      const created = (await response.json()) as EventDto;
      queryClient.setQueryData<EventDto[]>(EVENTS_KEY, (current) => [...(current ?? []), created].sort((a, b) => a.day.localeCompare(b.day)));
      return true;
    } catch {
      return false;
    }
  }

  async function deleteEvent(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/agenda/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) return false;
      queryClient.setQueryData<EventDto[]>(EVENTS_KEY, (current) => current?.filter((event) => event.id !== id));
      return true;
    } catch {
      return false;
    }
  }

  return { addEvent, deleteEvent };
}
