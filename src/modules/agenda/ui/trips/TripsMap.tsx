import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import Typography from "@mui/material/Typography";
import L from "leaflet";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-50m.json";
import { COUNTRIES } from "@modules/agenda/domain/countries";
import { CHART_ACCENT, PALE_TINT, PALETTE } from "@shared/ui/theme";
import type { TripDto } from "../tripQueries";
import { countryName, tripDate } from "./countryNames";
import { MAP_HEIGHT } from "./mapSize";

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

/**
 * El mundo entero, sin la Antártida (que estira el mapa hacia abajo) y con lo que
 * pasa de la línea de cambio de fecha (Rusia, Fiji). Es el máximo alejamiento:
 * el zoom mínimo es el que lo enseña entero, y no se puede salir de él.
 */
const WORLD_BOUNDS = L.latLngBounds([-58, -170], [84, 192]);

/** Lo más cerca que se puede llegar: un país mediano llena el mapa. */
const MAX_ZOOM = 6;

/** Cuánto se ve el aviso de "usa Ctrl + rueda" / "usa dos dedos". */
const HINT_MS = 1600;

/** El mar en un tinte claro de Loblolly, la tierra en blanco y lo visitado en el azul de acento (Country Blue): se ve vivo sobre lo demás. */
const SEA = PALE_TINT;
const LAND: L.PathOptions = { color: PALETTE.loblolly, weight: 0.6, fillColor: "#FFFFFF", fillOpacity: 1 };
const VISITED: L.PathOptions = { color: "#FFFFFF", weight: 0.8, fillColor: CHART_ACCENT, fillOpacity: 1 };
const HOVER: L.PathOptions = { fillColor: PALETTE.loblolly };

/**
 * RF-49: el mapa de los viajes, con Leaflet directamente (licencia BSD; sin
 * `react-leaflet`, que tiene una licencia no estándar). En lugar de teselas
 * de un servidor externo, pinta las formas de los países que trae la app: los
 * visitados, en azul marino, con sus viajes al pasar por encima. Pulsar un
 * país lo elige en el formulario. Zoom con Ctrl/⌘ + rueda (o pellizcando), los
 * botones o el teclado (+ y −, flechas para moverse); la rueda sola desplaza la
 * página y avisa de cómo hacer zoom. En móvil, el mapa se mueve con dos dedos.
 */
export function TripsMap({ trips, onCountryClick }: TripsMapProps) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  // El aviso que explica cómo hacer zoom, o mover el mapa en móvil, sin atrapar el desplazamiento de la página.
  const [hint, setHint] = useState<"wheel" | "touch" | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
    const container = containerRef.current;
    // Rueda sola y un dedo, para desplazar la página; el mapa se acerca con Ctrl/⌘ + rueda (o pellizcando) y se mueve
    // arrastrando con el ratón o con dos dedos. Así el mapa no atrapa el desplazamiento de la página.
    const map = L.map(container, { zoomSnap: 0.5, maxZoom: MAX_ZOOM, scrollWheelZoom: false, dragging: !L.Browser.mobile, worldCopyJump: false, maxBounds: WORLD_BOUNDS.pad(0.05), maxBoundsViscosity: 1 });
    // El zoom mínimo, el que enseña el mundo entero en el ancho que haya (también al cambiar el tamaño de la ventana).
    const fitWorld = () => {
      const minZoom = map.getBoundsZoom(WORLD_BOUNDS, false);
      map.setMinZoom(minZoom);
      if (map.getZoom() < minZoom) map.setZoom(minZoom);
    };
    map.fitBounds(WORLD_BOUNDS);
    fitWorld();
    map.on("resize", fitWorld);
    const showHint = (kind: "wheel" | "touch") => {
      setHint(kind);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(null), HINT_MS);
    };
    const onWheel = (wheelEvent: WheelEvent) => {
      if (!wheelEvent.ctrlKey && !wheelEvent.metaKey) {
        showHint("wheel");
        return;
      }
      wheelEvent.preventDefault();
      map.setZoomAround(map.mouseEventToContainerPoint(wheelEvent), map.getZoom() + (wheelEvent.deltaY < 0 ? 0.5 : -0.5));
    };
    const onTouch = (touchEvent: TouchEvent) => {
      if (L.Browser.mobile && touchEvent.touches.length === 1) showHint("touch");
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouch, { passive: true });
    map.attributionControl.setPrefix(false).addAttribution("Natural Earth");
    // El CSS de Leaflet pone un fondo gris al mapa y, al no ir en una capa, gana al `sx` (MUI va en la capa "mui"):
    // el color del mar se fija en el propio elemento.
    containerRef.current.style.backgroundColor = SEA;
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
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouch);
      clearTimeout(hintTimer.current);
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
      if (map.getZoom() < map.getMinZoom()) map.setZoom(map.getMinZoom());
    }
  }, [trips, i18n.language]);

  return (
    <Box sx={{ position: "relative" }}>
      <Box ref={containerRef} role="group" aria-label={t("viajes.mapa")} sx={{ height: MAP_HEIGHT, width: "100%", overflow: "hidden", bgcolor: SEA }} />
      {/* El aviso, encima del mapa y sin capturar el ratón. */}
      <Box aria-live="polite" sx={{ position: "absolute", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", bgcolor: hint ? "rgba(0, 19, 18, 0.45)" : "transparent", transition: "background-color 200ms" }}>
        {hint && (
          <Typography variant="body1" sx={{ color: "common.white", fontWeight: 600, px: 2, textAlign: "center" }}>
            {t(hint === "wheel" ? "viajes.avisoRueda" : "viajes.avisoDosDedos")}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
