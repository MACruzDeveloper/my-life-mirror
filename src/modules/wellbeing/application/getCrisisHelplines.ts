import helplines from "../domain/catalog/helplines.json" with { type: "json" };
import type { CrisisHelpline } from "../domain/CrisisHelpline.js";

const ALL: readonly CrisisHelpline[] = helplines;
const INTERNATIONAL = "INTL";

/**
 * RF-30 — contenido real y verificado, no ilustrativo (única excepción
 * explícita a RES-10). Revisar periódicamente que los datos siguen vigentes.
 * Solo España tiene líneas propias: añadir más países en el catálogo cuando
 * haga falta, nunca inventando un número que no se pueda verificar.
 * Sin Result: un país sin datos propios recibe el directorio internacional, nunca un error.
 */
export function getCrisisHelplines(country: string): CrisisHelpline[] {
  const code = country.trim().toUpperCase();
  const own = ALL.filter((line) => line.country === code);
  return own.length > 0 ? own : ALL.filter((line) => line.country === INTERNATIONAL);
}
