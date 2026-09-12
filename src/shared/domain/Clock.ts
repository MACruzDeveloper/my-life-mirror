/**
 * Puerto para obtener la hora actual. El dominio depende de esta abstracción
 * en vez de `new Date()` directamente, para poder fijar el tiempo en tests
 * cuando haga falta sin tocar la lógica de negocio.
 */
export interface Clock {
  now(): Date;
}
