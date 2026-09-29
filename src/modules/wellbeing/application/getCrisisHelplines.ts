import type { CrisisHelpline } from "@modules/wellbeing/domain/CrisisHelpline";

/**
 * RF-30 — contenido real y verificado, no ilustrativo (única excepción
 * explícita a RES-10). Revisar periódicamente que los datos siguen vigentes;
 * generado a partir de conocimiento de entrenamiento, no de una fuente en vivo.
 *
 * Alcance deliberadamente reducido a España para el Ciclo 1 (mismo espíritu
 * de RES-10 aplicado a otras funcionalidades): añadir más países aquí cuando
 * haga falta, nunca inventando un número que no se pueda verificar.
 */
const HELPLINES_BY_COUNTRY: Record<string, CrisisHelpline[]> = {
  ES: [
    {
      pais: "ES",
      name: "Línea 024 — Atención a la conducta suicida",
      phone: "024",
      availability: "24 horas, todos los días, gratuita",
    },
    {
      pais: "ES",
      name: "Emergencias (Unión Europea)",
      phone: "112",
      availability: "24 horas, todos los días",
    },
  ],
};

const DEFAULT_INTERNATIONAL_HELPLINE: CrisisHelpline = {
  pais: "INTL",
  name: "Find A Helpline — directorio internacional verificado",
  phone: "https://findahelpline.com",
  availability: "Según el país seleccionado en el directorio",
};

/** Sin Result: no hay un caso de fallo real — un país sin datos propios recibe el recurso por defecto, nunca un error. */
export function getCrisisHelplines(pais: string): CrisisHelpline[] {
  const code = pais.trim().toUpperCase();
  return HELPLINES_BY_COUNTRY[code] ?? [DEFAULT_INTERNATIONAL_HELPLINE];
}
