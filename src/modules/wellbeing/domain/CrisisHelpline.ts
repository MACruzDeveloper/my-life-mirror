/**
 * RF-30: una línea de ayuda en crisis. Real y verificada, nunca de ejemplo
 * (RES-10). Datos en `catalog/helplines.json` (CAT-01); el nombre y la
 * disponibilidad, en las traducciones (`ayuda.lineas.<key>`).
 */
export interface CrisisHelpline {
  readonly key: string;
  /** Código ISO del país, o `INTL` para el directorio internacional. */
  readonly country: string;
  /** Para llamar (`tel:`); las que no tienen teléfono tienen enlace. */
  readonly phone?: string;
  readonly url?: string;
}
