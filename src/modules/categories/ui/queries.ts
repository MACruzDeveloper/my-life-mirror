import { useQuery } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";

export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  isSensitiveData?: boolean;
  status: "active" | "inactive";
}

export const CATEGORIES_KEY = ["categories"] as const;

/** Categorías del usuario (RF-06), en caché compartida entre pantallas. */
export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: () => getJson<CategoryDto[]>("/api/categories") });
}
