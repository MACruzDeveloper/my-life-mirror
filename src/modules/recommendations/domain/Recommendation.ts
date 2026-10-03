/**
 * RD-04. Una recomendación propuesta a un usuario concreto para una categoría.
 * Guarda la *clave* de la plantilla (`economia.1`), no el texto: la interfaz
 * lo traduce al idioma del usuario y el catálogo puede crecer sin migrar datos.
 * `threshold` es el umbral con el que se disparó (RD-04: condición de disparo):
 * la recomendación solo se muestra mientras la puntuación siga por debajo.
 * Estados de [09_Diagrama_Estados_Recomendacion.md]: en el corte de RF-18 solo
 * se crea `pending`; el resto llega con RF-19.
 */
export const RECOMMENDATION_STATUSES = ["pending", "done", "discarded", "postponed"] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export interface Recommendation {
  readonly id: string;
  readonly userId: string;
  readonly categoryId: string;
  readonly templateKey: string;
  readonly threshold: number;
  readonly status: RecommendationStatus;
  readonly createdAt: Date;
}

/** "Abierta" = todavía sin resolver por el usuario (pendiente o pospuesta). */
export function isOpen(recommendation: Recommendation): boolean {
  return recommendation.status === "pending" || recommendation.status === "postponed";
}
