import hobbies from "./catalog/hobbies.json" with { type: "json" };
import occupations from "./catalog/occupations.json" with { type: "json" };

/**
 * RF-46: profesión y aficiones del perfil. Listas cerradas (CAT-01), nunca
 * texto libre: así no entra en el perfil nada que identifique a otra persona
 * ni instrucciones para la IA. Las profesiones son una muestra, no un censo.
 * Los textos viven en i18n (`perfil.ocupaciones.<clave>`, `perfil.aficiones.<clave>`).
 */
export const OCCUPATIONS: readonly string[] = occupations.map((occupation) => occupation.key);
export const HOBBIES: readonly string[] = hobbies.map((hobby) => hobby.key);

/** Las aficiones que se pueden marcar: suficientes para describirse, pocas para que la IA no reciba una lista sin fin. */
export const MAX_HOBBIES = 8;

export function isOccupation(key: string): boolean {
  return OCCUPATIONS.includes(key);
}

export function isHobby(key: string): boolean {
  return HOBBIES.includes(key);
}
