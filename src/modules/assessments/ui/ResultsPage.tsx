import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { RecommendationButton } from "@modules/recommendations/ui/RecommendationButton";
import { useRecommendations } from "@modules/recommendations/ui/queries";
import { ScoreCards } from "./ScoreCards";
import { useLatestScores } from "./queries";

/**
 * Resultados (dentro de Mi perfil): las tarjetas de detalle de cada categoría
 * activa — última puntuación, nota, fecha y banda — con el botón de la
 * recomendación si la hay. La vista gráfica (evolución) está en Inicio (RF-16).
 */
export function ResultsPage() {
  const { t } = useTranslation();
  const { data: latestScores, isPending, isError } = useLatestScores();
  // Secundarias: si fallan o tardan, los resultados se ven igual.
  const recommendations = useRecommendations().data ?? [];
  const { categoryLabel, isPending: labelsPending } = useCategoryLabel();

  if (isPending || labelsPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">{t("resultados.errorCarga")}</Alert>;
  }

  const hasAnswers = latestScores.some((latestScore) => latestScore.score !== undefined);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" component="h1">
        {t("resultados.titulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("resultados.descripcion")}
      </Typography>
      {latestScores.length === 0 ? (
        <Typography>{t("resultados.sinCategorias")}</Typography>
      ) : (
        <ScoreCards
          latestScores={latestScores}
          renderCardExtra={(categoryId) => {
            const recommendation = recommendations.find((candidate) => candidate.categoryId === categoryId);
            return recommendation ? <RecommendationButton templateKey={recommendation.templateKey} categoryName={categoryLabel(recommendation.catalogId).name} /> : null;
          }}
        />
      )}
      <Link component={RouterLink} to="/perfil/entrevista">
        {/* La entrevista es la primera vez; después se actualizan las respuestas, no se "hace otra". */}
        {hasAnswers ? t("entrevista.actualizarRespuestas") : t("resultados.empezar")}
      </Link>
    </Box>
  );
}
