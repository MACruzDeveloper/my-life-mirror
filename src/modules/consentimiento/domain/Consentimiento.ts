/**
 * Entidad Consentimiento — RF-04. Registra que un usuario aceptó
 * explícitamente el tratamiento de una categoría marcada como dato sensible
 * (RD-02.esDatoSensible), bajo una versión concreta de la política (RD-05) —
 * ver docs/user-stories/RF-04-consentimiento.md.
 */
export interface Consentimiento {
  readonly id: string;
  readonly usuarioId: string;
  readonly categoriaId: string;
  readonly versionPolitica: string;
  readonly otorgadoEn: Date;
}
