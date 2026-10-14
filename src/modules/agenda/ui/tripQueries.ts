import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";
import { byNewestTrip } from "@modules/agenda/domain/Trip";

/** RF-49: un viaje, como lo ve la pantalla. */
export interface TripDto {
  id: string;
  /** ISO de dos letras. */
  countryCode: string;
  year: number;
  /** De 1 a 12, si se indicó. */
  month?: number;
}

/** Fuera de `["assessments"]`: un viaje no cambia ninguna puntuación. Cada cambio actualiza esta caché a mano. */
export const TRIPS_KEY = ["agenda", "trips"] as const;

const fetchTrips = ({ signal }: { signal?: AbortSignal }) => getJson<TripDto[]>("/api/agenda/trips", signal);

export function useTrips() {
  return useQuery({ queryKey: TRIPS_KEY, queryFn: fetchTrips });
}

/** Pide los viajes antes de hacer falta (desde Categorías); si ya están en la caché, no hace nada. */
export function prefetchTrips(queryClient: QueryClient) {
  return queryClient.prefetchQuery({ queryKey: TRIPS_KEY, queryFn: fetchTrips });
}

/** Añadir y borrar: la caché se actualiza con la respuesta del servidor, sin volver a pedir la lista. */
export function useTripActions() {
  const queryClient = useQueryClient();

  async function addTrip(input: Omit<TripDto, "id">): Promise<boolean> {
    try {
      const response = await fetch("/api/agenda/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) return false;
      const created = (await response.json()) as TripDto;
      queryClient.setQueryData<TripDto[]>(TRIPS_KEY, (current) => [...(current ?? []), created].sort(byNewestTrip));
      return true;
    } catch {
      return false;
    }
  }

  async function deleteTrip(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/agenda/trips?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) return false;
      queryClient.setQueryData<TripDto[]>(TRIPS_KEY, (current) => current?.filter((trip) => trip.id !== id));
      return true;
    } catch {
      return false;
    }
  }

  return { addTrip, deleteTrip };
}
