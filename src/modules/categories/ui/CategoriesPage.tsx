import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { prefetchTrips } from "@modules/agenda/ui/tripQueries";
import { preloadTripsMap } from "@modules/agenda/ui/trips/preloadTripsMap";
import { Link as RouterLink } from "react-router";
import { resolveCategoryLabel } from "./categoryLabels";
import { hasCategoryPage } from "./categoryPages";
import { useCategoryLabelsQuery } from "./queries";

/**
 * RF-49: todas las categorías del catálogo en tarjetas. Cada una llevará a su
 * página, con lo que la persona ha vivido en ella; por ahora solo Aventura la
 * tiene, y el resto se ve desactivado ("Próximamente"). Mobile-first: una
 * columna en móvil, dos desde `sm` y tres desde `md`.
 */
export function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const labels = useCategoryLabelsQuery();
  const queryClient = useQueryClient();
  // Mientras se elige, se descargan el mapa y los viajes de Aventura: al entrar ya están (sin espera ni salto).
  useEffect(() => {
    void prefetchTrips(queryClient);
    void preloadTripsMap().catch(() => {});
  }, [queryClient]);

  if (labels.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const entries = (Array.isArray(labels.data) ? labels.data : []).map((entry) => ({ catalogId: entry.catalogId, key: entry.key, ...resolveCategoryLabel(new Map([[entry.catalogId, entry]]), entry.catalogId, i18n.language) }));

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3, px: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t("paginasCategoria.titulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("paginasCategoria.intro")}
      </Typography>
      {labels.isError && (
        <Typography variant="body2" color="error" role="alert">
          {t("categorias.errorCarga")}
        </Typography>
      )}
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
        {entries.map((entry) => {
          const content = (
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Typography variant="h6" component="h2">
                  {entry.name}
                </Typography>
                {hasCategoryPage(entry.key) ? <ArrowForwardIcon color="secondary" aria-hidden /> : <Chip size="small" label={t("paginasCategoria.proximamente")} />}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {entry.description}
              </Typography>
            </CardContent>
          );
          return (
            <Box component="li" key={entry.catalogId}>
              {hasCategoryPage(entry.key) ? (
                <Card variant="outlined" sx={{ height: "100%", borderColor: "primary.main" }}>
                  <CardActionArea component={RouterLink} to={`/categorias/${entry.key}`} sx={{ height: "100%" }}>
                    {content}
                  </CardActionArea>
                </Card>
              ) : (
                <Card variant="outlined" aria-disabled="true" sx={{ height: "100%", opacity: 0.6 }}>
                  {content}
                </Card>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
