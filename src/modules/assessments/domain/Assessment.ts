/**
 * RD-03 (`Evaluación`, un check-in por categoría). Registro inmutable
 * (RF-12): solo se inserta, nunca se actualiza — por eso el repositorio no
 * tiene `update`. `note` es opcional (RD-03; RF-11 es Should pero el modelo
 * ya la admite para no tocar entidad/tabla/endpoint otra vez después).
 */
export interface Assessment {
  readonly id: string;
  readonly userId: string;
  readonly categoryId: string;
  readonly score: number;
  readonly note?: string;
  readonly recordedAt: Date;
}
