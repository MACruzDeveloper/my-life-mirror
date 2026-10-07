import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { RecommendationButton } from "@modules/recommendations/ui/RecommendationButton";
import { useAiIdeasActive } from "@modules/accounts/ui/queries";
import { useRecommendations } from "@modules/recommendations/ui/queries";
import { HistoryTimeline } from "./HistoryTimeline";
import { ScoreCards } from "./ScoreCards";
import { useLatestScores } from "./queries";

/**
 * Resultados (dentro de Mi perfil): las tarjetas de detalle de cada categoría
 * activa — última puntuación, fecha y banda — con el botón de la
 * recomendación si la hay, y el historial de cambios por día (UX-05). La vista
 * gráfica (evolución) está en Inicio (RF-16).
 */
export function ResultsPage() {
  const { t } = useTranslation();
  const { data: latestScores, isPending, isError } = useLatestScores();
  // Secundarias: si fallan o tardan, los resultados se ven igual.
  const recommendations = useRecommendations().data ?? [];
  const personalize = useAiIdeasActive();
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
            return recommendation ? (
              <RecommendationButton recommendationId={recommendation.id} categoryId={recommendation.categoryId} categoryKey={categoryLabel(recommendation.catalogId).key} personalize={personalize} templateKey={recommendation.templateKey} categoryName={categoryLabel(recommendation.catalogId).name} />
            ) : null;
          }}
        />
      )}
      <Link component={RouterLink} to="/perfil/entrevista">
        {/* La entrevista es la primera vez; después se actualizan las respuestas, no se "hace otra". */}
        {hasAnswers ? t("entrevista.actualizarRespuestas") : t("resultados.empezar")}
      </Link>
      {/* UX-05: el historial de cambios vive aquí; en la entrevista queda la última actualización de cada categoría. */}
      {hasAnswers && <HistoryTimeline />}
    </Box>
  );
}
