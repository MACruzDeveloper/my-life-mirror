import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";
import type { LatestScoreDto } from "./ScoreCards";

export interface HistoryEntryDto {
  categoryId: string;
  categoryName: string;
  /** Identidad en el catálogo: se muestra con `useCategoryLabel`. */
  catalogId?: string;
  score: number;
  previousScore?: number;
  note?: string;
}

export interface HistorySessionDto {
  recordedAt: string;
  entries: HistoryEntryDto[];
}

export const ASSESSMENTS_KEY = ["assessments"] as const;
export const LATEST_SCORES_KEY = ["assessments", "latest"] as const;
export const HISTORY_KEY = ["assessments", "history"] as const;

/** Última puntuación por categoría activa (Entrevista, Resultados e Inicio comparten esta caché). */
export function useLatestScores() {
  return useQuery({ queryKey: LATEST_SCORES_KEY, queryFn: ({ signal }) => getJson<LatestScoreDto[]>("/api/assessments", signal) });
}

export function useAssessmentHistory() {
  return useQuery({ queryKey: HISTORY_KEY, queryFn: ({ signal }) => getJson<HistorySessionDto[]>("/api/assessments/history", signal) });
}

/** RF-44: una experiencia del diario (privada salvo que se comparta, RF-43). */
export interface ExperienceDto {
  id: string;
  categoryId: string;
  text: string;
  createdAt: string;
  /** RF-43: compartida de forma anónima. */
  shared?: boolean;
  /** RF-43: retirada tras un reporte; ya no se puede volver a compartir. */
  reported?: boolean;
}

/** Fuera de `["assessments"]`: guardar una puntuación no las cambia. Añadir o borrar las actualiza con `setQueryData`. */
export const EXPERIENCES_KEY = ["experiences"] as const;

/** Las del usuario, la más reciente primero. */
export function useExperiences() {
  return useQuery({ queryKey: EXPERIENCES_KEY, queryFn: ({ signal }) => getJson<ExperienceDto[]>("/api/categories/diary", signal) });
}

/** RF-43: los motivos por los que el servidor no deja compartir (más "error", si no se pudo preguntar). */
export type ShareFailure = "score" | "category" | "reported" | "contact" | "health" | "offensive" | "error";
export type ShareOutcome = { ok: true } | { ok: false; reason: ShareFailure };

/**
 * RF-43: compartir o dejar de compartir una experiencia, con la caché del diario
 * al día (la entrevista y Privacidad y datos la comparten). Compartir espera al
 * servidor (puede rechazarlo por los filtros); dejar de compartir es inmediato
 * y vuelve atrás si falla.
 */
export function useExperienceSharing() {
  const queryClient = useQueryClient();
  const replace = (updated: ExperienceDto) =>
    queryClient.setQueryData<ExperienceDto[]>(EXPERIENCES_KEY, (current) => current?.map((experience) => (experience.id === updated.id ? { ...experience, ...updated } : experience)));

  async function share(experience: ExperienceDto, locale: string): Promise<ShareOutcome> {
    try {
      const response = await fetch("/api/categories/diary", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: experience.id, shared: true, locale }) });
      if (response.status === 422) {
        const { reason } = (await response.json()) as { reason?: ShareFailure };
        return { ok: false, reason: reason ?? "error" };
      }
      if (!response.ok) return { ok: false, reason: "error" };
      replace((await response.json()) as ExperienceDto);
      return { ok: true };
    } catch {
      return { ok: false, reason: "error" };
    }
  }

  async function unshare(experience: ExperienceDto): Promise<boolean> {
    replace({ ...experience, shared: false });
    try {
      const response = await fetch("/api/categories/diary", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: experience.id, shared: false }) });
      if (!response.ok) throw new Error("rejected");
      return true;
    } catch {
      replace(experience);
      return false;
    }
  }

  return { share, unshare };
}

/** RF-43: una experiencia de otra persona: solo el texto (y el id, para reportarla). */
export interface SharedExperienceDto {
  id: string;
  text: string;
}

export const sharedExperiencesKey = (categoryId: string, locale: string) => ["sharedExperiences", categoryId, locale] as const;

/** RF-43: las que comparten otras personas en esa categoría y ese idioma; se piden al abrir la ventana de ideas. */
export function useSharedExperiences(categoryId: string | undefined, locale: string, enabled: boolean) {
  return useQuery({
    queryKey: sharedExperiencesKey(categoryId ?? "", locale),
    queryFn: ({ signal }) => getJson<SharedExperienceDto[]>(`/api/categories/shared?categoryId=${encodeURIComponent(categoryId ?? "")}&locale=${encodeURIComponent(locale)}`, signal),
    enabled: enabled && categoryId !== undefined,
  });
}
