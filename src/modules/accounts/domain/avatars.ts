import catalog from "./catalog/avatars.json" with { type: "json" };

/**
 * RF-26: un avatar del catálogo cerrado. `description` es lo que se le pide al
 * modelo de imagen: solo rasgos visibles, nunca etiquetas de género, origen,
 * religión o edad (lo comprueba el test de integridad con
 * `catalog/avatarBannedTerms.json`). `published` lo pone el autor al revisar
 * la imagen y darla por buena: nada llega a la app sin esa revisión.
 */
export interface Avatar {
  readonly key: string;
  readonly description: string;
  /** Lo que no debe aparecer en el dibujo ("barba, gafas"): decirlo en la descripción hace que el modelo lo dibuje. */
  readonly avoid?: string;
  readonly published: boolean;
}

export const AVATARS: readonly Avatar[] = catalog;

/** Los que se pueden elegir: generados, revisados y con su imagen en `public/avatars/<clave>.webp`. */
export function publishedAvatarKeys(): string[] {
  return AVATARS.filter((avatar) => avatar.published).map((avatar) => avatar.key);
}

export function isAvatarKey(key: string): boolean {
  return publishedAvatarKeys().includes(key);
}
