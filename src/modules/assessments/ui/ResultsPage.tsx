import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { RecommendationButton } from "@modules/recommendations/ui/RecommendationButton";
import { useAiIdeasActive } from "@modules/accounts/ui/queries";
import { useRecommendations } from "@modules/recommendations/ui/queries";
import { HistoryTimeline } from "./HistoryTimeline";
import { ScoreBars } from "./ScoreBars";
import { useLatestScores } from "./queries";
import { PageLoader } from "@shared/ui/components/PageLoader";

/**
 * Resultados (dentro de Mi perfil): la última puntuación de cada categoría
 * activa en un gráfico de barras (UX-13) — número, banda y fecha — con el
 * botón de la recomendación si la hay, y el historial de cambios por día (UX-05). La vista
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
      <PageLoader />
    );
  }

  if (isError) {
    return <Alert severity="error">{t("resultados.errorCarga")}</Alert>;
  }

  const hasAnswers = latestScores.some((latestScore) => latestScore.score !== undefined);
  // Una idea por categoría (la primera, como antes en cada tarjeta), en el orden de las categorías.
  const ideas = latestScores.flatMap((latestScore) => recommendations.find((candidate) => candidate.categoryId === latestScore.categoryId) ?? []);

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
        <>
          <ScoreBars latestScores={latestScores} />
          {ideas.length > 0 && (
            // RF-18: las ideas abiertas, cada una junto al nombre de su categoría (un gráfico no lleva botones).
            <Box component="section" aria-labelledby="resultados-ideas">
              <Typography id="resultados-ideas" variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                {t("resultados.ideas")}
              </Typography>
              <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                {ideas.map((recommendation) => (
                  <Box component="li" key={recommendation.id} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                    <Typography component="span" sx={{ minWidth: { sm: 160 } }}>
                      {categoryLabel(recommendation.catalogId).name}
                    </Typography>
                    <RecommendationButton recommendationId={recommendation.id} categoryId={recommendation.categoryId} categoryKey={categoryLabel(recommendation.catalogId).key} personalize={personalize} templateKey={recommendation.templateKey} categoryName={categoryLabel(recommendation.catalogId).name} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </>
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
