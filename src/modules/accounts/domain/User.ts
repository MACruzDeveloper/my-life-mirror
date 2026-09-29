/**
 * Entidad Usuario. Ya no guarda passwordHash — Supabase Auth es quien
 * custodia las credenciales (ADR-06); aquí solo se refleja la identidad
 * que nuestra aplicación necesita conocer.
 */
export interface User {
  readonly id: string;
  readonly email: string;
}
