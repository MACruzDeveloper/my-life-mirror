/**
 * RF-19: lo que una persona decide sobre una idea del carrusel. Son las tres
 * salidas del requisito, aplicadas a cada idea: guardarla para después
 * ("pospuesta"), darla por hecha, o apartarla ("descartada").
 */
export const IDEA_REACTIONS = ["saved", "done", "discarded"] as const;
export type IdeaReactionKind = (typeof IDEA_REACTIONS)[number];

/**
 * Una reacción por idea y categoría del usuario. Se guarda la clave de la idea
 * del catálogo (`economia.2`), nunca su texto: así se muestra en el idioma de
 * la interfaz y vale igual si se vio personalizada por la IA (RF-40).
 */
export interface IdeaReaction {
  readonly userId: string;
  readonly categoryId: string;
  readonly templateKey: string;
  readonly reaction: IdeaReactionKind;
  readonly reactedAt: Date;
}

/** Puerto — ADR-03 apartado 3.3. */
export interface IdeaReactionRepository {
  findByUserId(userId: string): Promise<IdeaReaction[]>;
  /** Guarda o sustituye la reacción a esa idea (una por usuario, categoría e idea). */
  save(reaction: IdeaReaction): Promise<void>;
  /** Quita la reacción a esa idea. Repetible: no falla si no existía. */
  delete(userId: string, categoryId: string, templateKey: string): Promise<void>;
  /** Borra todas las del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
