import { lazy, Suspense, useId, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import FlightTakeoffOutlinedIcon from "@mui/icons-material/FlightTakeoffOutlined";
import { useTranslation } from "react-i18next";
import { LoadErrorBoundary } from "@shared/ui/components/LoadErrorBoundary";
import { type TripDto, useTripActions, useTrips } from "../tripQueries";
import { countryName, countryOptions, monthNames, tripDate } from "./countryNames";
import { preloadTripsMap } from "./preloadTripsMap";
import Skeleton from "@mui/material/Skeleton";

/** Leaflet y las formas de los países solo se descargan al abrir la página que los usa (como los gráficos en Inicio). */
const TripsMap = lazy(() => preloadTripsMap().then((module) => ({ default: module.TripsMap })));

const FIRST_YEAR = 1900;
/** Los mismos dos años vista que admite el servidor (un viaje que se está planeando). */
const YEARS_AHEAD = 2;

const MAP_HEIGHT = { xs: 300, md: 440 };

/**
 * RF-49: "Tus viajes", en la página de Aventura. Arriba, el mapa a todo lo
 * ancho, con los países visitados pintados; debajo, el formulario y la lista
 * (también la forma de verlos sin el mapa). Un viaje es un país de la lista
 * (con búsqueda, o pulsando en el mapa) y un año, con el mes si se recuerda:
 * sin texto libre. Son recuerdos: no cambian ninguna nota (RN-04).
 */
export function TripsSection() {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const trips = useTrips();
  const { addTrip, deleteTrip } = useTripActions();
  const options = useMemo(() => countryOptions(i18n.language), [i18n.language]);
  const months = useMemo(() => monthNames(i18n.language), [i18n.language]);
  const lastYear = new Date().getFullYear() + YEARS_AHEAD;
  const years = Array.from({ length: lastYear - FIRST_YEAR + 1 }, (_, index) => lastYear - index);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const list: TripDto[] = Array.isArray(trips.data) ? trips.data : [];

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!countryCode || !year) return;
    setSending(true);
    const added = await addTrip({ countryCode, year: Number(year), ...(month ? { month: Number(month) } : {}) });
    setSending(false);
    setFailed(!added);
    if (added) {
      setCountryCode(null);
      setYear("");
      setMonth("");
    }
  }

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ p: 2.5, borderRadius: 0, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FlightTakeoffOutlinedIcon color="primary" />
        <Typography id={titleId} variant="h6" component="h2">
          {t("viajes.titulo")}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("viajes.intro")}
      </Typography>
      {/* Si el mapa no se puede descargar, se dice y el formulario y la lista siguen funcionando. */}
      <LoadErrorBoundary
        fallback={
          <Box role="status" sx={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center", px: 2, textAlign: "center", borderRadius: 2, bgcolor: "background.default" }}>
            <Typography variant="body2" color="text.secondary">
              {t("viajes.mapaNoCarga")}
            </Typography>
          </Box>
        }
      >
        <Suspense
          fallback={
            <Box sx={{ height: MAP_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
              <CircularProgress size={24} />
            </Box>
          }
        >
          <TripsMap trips={list} onCountryClick={setCountryCode} />
        </Suspense>
      </LoadErrorBoundary>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75, mb: 2.5 }}>
        {t("viajes.comoUsarMapa")}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <Box component="form" onSubmit={handleSubmit} aria-label={t("viajes.anadirTitulo")} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="subtitle2" component="h3">
            {t("viajes.anadirTitulo")}
          </Typography>
          <Autocomplete
            options={options}
            value={options.find((option) => option.code === countryCode) ?? null}
            onChange={(_, option) => setCountryCode(option?.code ?? null)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            noOptionsText={t("viajes.sinPaises")}
            renderInput={(params) => <TextField {...params} label={t("viajes.pais")} size="small" required />}
          />
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
            <TextField select label={t("viajes.anio")} value={year} onChange={(changeEvent) => setYear(changeEvent.target.value)} size="small" required fullWidth>
              {years.map((option) => (
                <MenuItem key={option} value={String(option)}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label={t("viajes.mes")} value={month} onChange={(changeEvent) => setMonth(changeEvent.target.value)} size="small" fullWidth>
              <MenuItem value="">{t("viajes.sinMes")}</MenuItem>
              {months.map((name, index) => (
                <MenuItem key={name} value={String(index + 1)}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Button type="submit" variant="contained" color="secondary" disabled={sending} sx={{ alignSelf: { sm: "flex-start" } }}>
            {t("viajes.anadir")}
          </Button>
          {failed && (
            <Typography variant="body2" color="error" role="alert">
              {t("viajes.error")}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="subtitle2" component="h3">
            {t("viajes.tusViajes", { count: list.length })}
          </Typography>
          {trips.isPending ? (
            // Mientras llegan, el sitio que ocuparán: sin saltos al aparecer.
            <Box aria-hidden sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} variant="rectangular" height={40} />
              ))}
            </Box>
          ) : list.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("viajes.ninguno")}
            </Typography>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              {list.map((trip) => {
                const name = countryName(trip.countryCode, i18n.language);
                const date = tripDate(trip.year, trip.month, i18n.language);
                return (
                  <Box component="li" key={trip.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2">{name}</Typography>
                      <Typography variant="caption" color="text.secondary" component="p">
                        {date}
                      </Typography>
                    </Box>
                    <IconButton size="small" aria-label={t("viajes.borrar", { pais: name, fecha: date })} onClick={() => void deleteTrip(trip.id).then((deleted) => setFailed(!deleted))}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" component="p">
            {t("viajes.noCambianNota")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
