import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { RecommendationDisclaimer, RecommendationNote } from "@modules/recommendations/ui/RecommendationNote";
import { useRecommendations } from "@modules/recommendations/ui/queries";
import { ScoreCards } from "./ScoreCards";
import { useLatestScores } from "./queries";

/** Última puntuación de cada categoría activa (precursor mínimo de RF-14). */
export function ResultsPage() {
  const { t } = useTranslation();
  const { data: resultados, isPending, isError } = useLatestScores();
  // Secundarias: si fallan o tardan, los resultados se ven igual.
  const recomendaciones = useRecommendations().data ?? [];

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">{t("resultados.errorCarga")}</Alert>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" component="h1">
        {t("resultados.titulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("resultados.descripcion")}
      </Typography>
      {resultados.length === 0 ? (
        <Typography>{t("resultados.sinCategorias")}</Typography>
      ) : (
        <ScoreCards
          resultados={resultados}
          extraFor={(id) => {
            const r = recomendaciones.find((x) => x.categoryId === id);
            return r ? <RecommendationNote templateKey={r.templateKey} categoryName={r.categoryName} /> : null;
          }}
        />
      )}
      {recomendaciones.length > 0 && <RecommendationDisclaimer />}
      <Link component={RouterLink} to="/perfil/entrevista">
        {t("resultados.empezar")}
      </Link>
    </Box>
  );
}
