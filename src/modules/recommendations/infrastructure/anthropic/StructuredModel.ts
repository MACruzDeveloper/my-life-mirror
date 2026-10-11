import type { z } from "zod";

/**
 * RF-40b: lo único que el adaptador necesita de un modelo de lenguaje: una
 * respuesta que cumpla un esquema. Lanza si el modelo rehúsa, si la respuesta
 * no encaja o si el proveedor falla o tarda; quien lo usa cae al texto curado.
 * Así el adaptador se prueba con un modelo simulado, sin red ni crédito.
 */
export interface StructuredModel {
  /** Identificador del modelo, que se guarda con cada idea personalizada. */
  readonly model: string;
  ask<T>(input: { system: string; user: string; schema: z.ZodType<T> }): Promise<T>;
}
