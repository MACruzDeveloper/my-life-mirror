/**
 * RF-44: una experiencia del diario de una categoría. Privada: solo la ve el
 * usuario y nunca va a la IA (salvo que él lo pida para una concreta, RF-45).
 * Separada de las evaluaciones, que son inmutables (RF-12), para poder borrarla.
 */
export interface Experience {
  readonly id: string;
  readonly userId: string;
  readonly categoryId: string;
  readonly text: string;
  readonly createdAt: Date;
}

export const MAX_EXPERIENCE_LENGTH = 500;

/** Puerto — ADR-03 apartado 3.3. */
export interface ExperienceRepository {
  findByUserId(userId: string): Promise<Experience[]>;
  save(experience: Experience): Promise<void>;
  /** Borra la experiencia si es de ese usuario; `false` si no existe o es de otro. */
  delete(userId: string, experienceId: string): Promise<boolean>;
  /** Borra todas las del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
