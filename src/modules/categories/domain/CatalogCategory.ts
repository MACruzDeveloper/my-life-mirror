/**
 * ADM-02. Entrada del catálogo global de categorías, que gestiona el admin.
 * Las categorías de cada usuario (`Category`) se siembran a partir de aquí.
 * `retiredAt` en vez de borrar: retirar una categoría no destruye las
 * evaluaciones de nadie (RF-12) — solo deja de ofrecerse. `isSensitiveData`
 * no se puede cambiar tras crearla (afectaría a consentimientos ya dados).
 */
export interface CatalogCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly isSensitiveData: boolean;
  readonly retiredAt?: Date;
}
