/**
 * RD-02. Cada usuario tiene su propia copia de las categorías (sin tabla de
 * catálogo global aparte) — RF-07 necesita estado de activación por
 * usuario, y el diagrama de clases no modela una entidad de unión, así que
 * `userId` vive directamente aquí. `type: "custom"` ya cubre RF-08 (Could,
 * fuera del MVP por ahora) sin cambios futuros al modelo.
 */
export type CategoryType = "standard" | "custom";
export type CategoryStatus = "active" | "inactive";

export interface Category {
  readonly id: string;
  readonly userId: string;
  /**
   * Entrada del catálogo de la que es copia: su identidad (no el nombre). La
   * interfaz muestra el texto de cada idioma buscándolo por este id. Opcional
   * solo para categorías propias del usuario (RF-08, sin construir).
   */
  readonly catalogId?: string;
  /** Texto en el idioma por defecto, copiado del catálogo al crearla (exportación de datos, registros). */
  readonly name: string;
  readonly description: string;
  readonly type: CategoryType;
  readonly status: CategoryStatus;
  readonly isSensitiveData: boolean;
}
