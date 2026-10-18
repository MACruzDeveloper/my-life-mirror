import countries from "./catalog/countries.json" with { type: "json" };

/**
 * RF-49: los países que se pueden elegir para un viaje. Lista cerrada (CAT-01),
 * generada una vez a partir del mapa que pinta la app (Natural Earth, paquete
 * `world-atlas`, escala 1:50 millones): así todo país elegible tiene forma en el
 * mapa. `code` es el ISO 3166-1 de dos letras; `numeric`, el ISO numérico con el
 * que el mapa identifica su forma, y `mapName`, su nombre en el mapa cuando no
 * tiene número (Kosovo). Los nombres visibles los da el navegador
 * (`Intl.DisplayNames`) en el idioma de la interfaz: sin traducciones propias.
 * Quedan fuera las zonas del mapa sin código propio (Somalilandia, Chipre del
 * Norte, territorios del océano Índico, glaciar de Siachen).
 */
export interface Country {
  readonly code: string;
  readonly numeric?: string;
  readonly mapName?: string;
}

export const COUNTRIES: readonly Country[] = countries;

const CODES = new Set(COUNTRIES.map((country) => country.code));

export function isCountryCode(value: string): boolean {
  return CODES.has(value);
}
