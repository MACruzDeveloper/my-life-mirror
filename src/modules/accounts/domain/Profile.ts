/**
 * RF-03. El diagrama de clases (RD-01) modela estos campos sobre la propia
 * entidad `Usuario`, pero viven en su propio sub-almacén dentro del módulo
 * `cuentas` — Supabase Auth solo custodia identidad y credenciales (ADR-06).
 * El avatar (RF-26) es la clave de uno del catálogo cerrado (`avatars.ts`), nunca una imagen subida.
 *
 * `name` se captura ya en el registro (RF-01) — es el único campo obligatorio
 * desde el principio; el resto se rellena más tarde en la pantalla de perfil
 * y por eso son opcionales (ver UpdateProfile, que hace upsert parcial).
 */
export const GENDERS = ["woman", "man", "non-binary", "prefer-not-to-say"] as const;
export type Gender = (typeof GENDERS)[number];

export interface Profile {
  readonly userId: string;
  readonly name: string;
  readonly birthDate?: string; // ISO "YYYY-MM-DD"
  readonly gender?: Gender;
  readonly timeZone?: string;
  /** RF-26: clave de un avatar publicado del catálogo; sin valor, el dibujo genérico. */
  readonly avatarKey?: string;
  /** RF-40: ideas personalizadas con IA, activadas por el propio usuario (desactivadas por defecto). */
  readonly aiIdeasEnabled?: boolean;
  /** Cuándo las activó (ISO), como constancia del consentimiento; sin valor si están desactivadas. */
  readonly aiIdeasEnabledAt?: string;
  /** RF-45: sugerencias de opciones a partir de una experiencia, activadas por el propio usuario (desactivadas por defecto). */
  readonly aiSuggestionsEnabled?: boolean;
  /** Cuándo las activó (ISO), como constancia del consentimiento. */
  readonly aiSuggestionsEnabledAt?: string;
}
