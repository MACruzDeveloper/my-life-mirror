import type { LineaAyudaCrisis } from "@modules/bienestar/domain/LineaAyudaCrisis";

/**
 * RF-30 — contenido real y verificado, no ilustrativo (única excepción
 * explícita a RES-10). Revisar periódicamente que los datos siguen vigentes;
 * generado a partir de conocimiento de entrenamiento, no de una fuente en vivo.
 *
 * Alcance deliberadamente reducido a España para el Ciclo 1 (mismo espíritu
 * de RES-10 aplicado a otras funcionalidades): añadir más países aquí cuando
 * haga falta, nunca inventando un número que no se pueda verificar.
 */
const LINEAS_POR_PAIS: Record<string, LineaAyudaCrisis[]> = {
  ES: [
    {
      pais: "ES",
      nombre: "Línea 024 — Atención a la conducta suicida",
      telefono: "024",
      disponibilidad: "24 horas, todos los días, gratuita",
    },
    {
      pais: "ES",
      nombre: "Emergencias (Unión Europea)",
      telefono: "112",
      disponibilidad: "24 horas, todos los días",
    },
  ],
};

const LINEA_INTERNACIONAL_POR_DEFECTO: LineaAyudaCrisis = {
  pais: "INTL",
  nombre: "Find A Helpline — directorio internacional verificado",
  telefono: "https://findahelpline.com",
  disponibilidad: "Según el país seleccionado en el directorio",
};

/** Sin Result: no hay un caso de fallo real — un país sin datos propios recibe el recurso por defecto, nunca un error. */
export function obtenerLineasAyudaCrisis(pais: string): LineaAyudaCrisis[] {
  const codigo = pais.trim().toUpperCase();
  return LINEAS_POR_PAIS[codigo] ?? [LINEA_INTERNACIONAL_POR_DEFECTO];
}
