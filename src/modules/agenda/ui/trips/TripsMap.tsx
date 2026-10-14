import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-50m.json";
import { COUNTRIES } from "@modules/agenda/domain/countries";
import { CHART_ACCENT, PALETTE } from "@shared/ui/theme";
import type { TripDto } from "../tripQueries";
import { countryName, tripDate } from "./countryNames";

interface TripsMapProps {
  trips: readonly TripDto[];
  /** Al pulsar un país del mapa: se elige en el formulario. */
  onCountryClick: (code: string) => void;
}

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }> & { id?: string };

/** Las formas de los países (Natural Earth, 1:50 millones), incluidas en la app: el mapa no pide nada a otros servidores. */
const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const RAW_SHAPES = feature(topology, topology.objects.countries) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>;

/**
 * Los países que cruzan la línea de cambio de fecha (Rusia, Fiji…) tienen
 * anillos que van de -180 a 180: Leaflet los pinta como bandas de lado a lado.
 * En esos anillos, las longitudes negativas pasan al otro lado (+360).
 */
function acrossDateLine(ring: GeoJSON.Position[]): GeoJSON.Position[] {
  const longitudes = ring.map(([lng]) => lng);
  if (Math.max(...longitudes) - Math.min(...longitudes) <= 180) return ring;
  return ring.map(([lng, lat]) => [lng < 0 ? lng + 360 : lng, lat]);
}

function withoutBands(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
  if (geometry.type === "Polygon") return { ...geometry, coordinates: geometry.coordinates.map(acrossDateLine) };
  if (geometry.type === "MultiPolygon") return { ...geometry, coordinates: geometry.coordinates.map((polygon) => polygon.map(acrossDateLine)) };
  return geometry;
}

/** La Antártida rodea el polo: su anillo sí va de -180 a 180 a propósito, y se deja tal cual. */
const ANTARCTICA = "010";

const COUNTRY_SHAPES: GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }> = {
  ...RAW_SHAPES,
  features: RAW_SHAPES.features.map((shape) => (String(shape.id) === ANTARCTICA ? shape : { ...shape, geometry: withoutBands(shape.geometry) })),
};

/** De la forma del mapa a su código ISO (por número o, si no tiene, por nombre). */
const CODE_BY_NUMERIC = new Map(COUNTRIES.flatMap((country) => (country.numeric ? [[country.numeric, country.code] as const] : [])));
const CODE_BY_MAP_NAME = new Map(COUNTRIES.flatMap((country) => (country.mapName ? [[country.mapName, country.code] as const] : [])));
function codeOf(shape: CountryFeature): string | undefined {
  return (shape.id !== undefined ? CODE_BY_NUMERIC.get(String(shape.id)) : undefined) ?? CODE_BY_MAP_NAME.get(shape.properties.name);
}

/** El mar en gris claro, la tierra en blanco y lo visitado en el verde azulado de acento: se ve vivo sobre lo demás. */
const SEA = PALETTE.mist;
const LAND: L.PathOptions = { color: PALETTE.silver, weight: 0.6, fillColor: "#FFFFFF", fillOpacity: 1 };
const VISITED: L.PathOptions = { color: "#FFFFFF", weight: 0.8, fillColor: CHART_ACCENT, fillOpacity: 1 };
const HOVER: L.PathOptions = { fillColor: PALETTE.slate };

/**
 * RF-49: el mapa de los viajes, con Leaflet directamente (licencia BSD; sin
 * `react-leaflet`, que tiene una licencia no estándar). En lugar de teselas
 * de un servidor externo, pinta las formas de los países que trae la app: los
 * visitados, en azul marino, con sus viajes al pasar por encima. Pulsar un
 * país lo elige en el formulario. Zoom con la rueda del ratón, los botones o
 * el teclado (+ y −, flechas para moverse).
 */
export function TripsMap({ trips, onCountryClick }: TripsMapProps) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fittedRef = useRef(false);
  // El último manejador, sin volver a montar el mapa cuando cambia.
  const onCountryClickRef = useRef(onCountryClick);
  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
  }, [onCountryClick]);

  // Montar el mapa una sola vez.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { center: [20, 10], zoom: 1.5, zoomSnap: 0.5, minZoom: 0, maxZoom: 7, scrollWheelZoom: true, worldCopyJump: false, maxBounds: [[-85, -220], [85, 380]], maxBoundsViscosity: 0.8 });
    map.attributionControl.setPrefix(false).addAttribution("Natural Earth");
    const layer = L.geoJSON(COUNTRY_SHAPES, {
      style: () => LAND,
      onEachFeature: (shape: CountryFeature, path) => {
        path.on("click", () => {
          const code = codeOf(shape);
          if (code) onCountryClickRef.current(code);
        });
        path.on("mouseover", () => (path as L.Path).setStyle(HOVER));
        path.on("mouseout", () => layer.resetStyle(path as L.Path));
      },
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = layer;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Pintar lo visitado y su información cada vez que cambian los viajes o el idioma.
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    const tripsByCode = new Map<string, TripDto[]>();
    for (const trip of trips) tripsByCode.set(trip.countryCode, [...(tripsByCode.get(trip.countryCode) ?? []), trip]);
    const visitedBounds: L.LatLngBounds[] = [];
    layer.setStyle((shape) => (tripsByCode.has(codeOf(shape as CountryFeature) ?? "") ? VISITED : LAND));
    layer.options.style = (shape) => (tripsByCode.has(codeOf(shape as CountryFeature) ?? "") ? VISITED : LAND);
    layer.eachLayer((path) => {
      const shape = (path as L.Polygon).feature as CountryFeature;
      const code = codeOf(shape);
      const countryTrips = code ? tripsByCode.get(code) : undefined;
      // Texto, nunca HTML: la información se monta con nodos de texto.
      const tooltip = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = code ? countryName(code, i18n.language) : shape.properties.name;
      tooltip.append(title);
      if (countryTrips) {
        const dates = document.createElement("div");
        dates.textContent = countryTrips.map((trip) => tripDate(trip.year, trip.month, i18n.language)).join(" · ");
        tooltip.append(dates);
        visitedBounds.push((path as L.Polygon).getBounds());
      }
      path.unbindTooltip().bindTooltip(tooltip, { sticky: true });
    });
    // Al abrir la página, que se vea todo lo visitado; después, el mapa es de la persona.
    if (!fittedRef.current && visitedBounds.length > 0) {
      fittedRef.current = true;
      map.fitBounds(visitedBounds.reduce((all, bounds) => all.extend(bounds)), { padding: [24, 24], maxZoom: 4 });
    }
  }, [trips, i18n.language]);

  return <Box ref={containerRef} role="group" aria-label={t("viajes.mapa")} sx={{ height: { xs: 300, md: 440 }, width: "100%", borderRadius: 2, overflow: "hidden", border: 1, borderColor: "divider", bgcolor: SEA, "& .leaflet-container": { bgcolor: SEA } }} />;
}
