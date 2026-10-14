/**
 * Descarga el mapa de los viajes (Leaflet y las formas de los países, el trozo
 * más pesado de la app) sin pintarlo. Lo usa la carga perezosa de la sección y
 * también Categorías, para tenerlo listo antes de entrar en Aventura.
 */
export function preloadTripsMap() {
  return import("./TripsMap");
}
