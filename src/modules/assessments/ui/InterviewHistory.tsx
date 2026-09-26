import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useCategoryLabels } from "@modules/categories/ui/categoryLabels";
import { useAssessmentHistory } from "./queries";

/**
 * Registro de cambios del usuario, en un lateral junto a la entrevista: qué
 * guardó y cuándo, con "antes → ahora" cuando cambió una puntuación. No es la
 * evolución gráfica (RF-14): solo una lista. Se refresca cuando la entrevista
 * invalida la caché de `assessments` tras guardar.
 */
export function InterviewHistory() {
  const { t, i18n } = useTranslation();
  const { data: sessions } = useAssessmentHistory();
  const labels = useCategoryLabels();

  const formatSessionDate = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { month: "long", year: "numeric", day: "numeric" });

  return (
    <Box component="aside" aria-labelledby="historial-titulo" sx={{ bgcolor: "#FFFFFF", border: "1px solid #E4EAE8", borderRadius: 3, p: 2 }}>
      <Typography id="historial-titulo" variant="subtitle1" component="h2" sx={{ mb: 1 }}>
        {t("entrevista.historialTitulo")}
      </Typography>
      {sessions && sessions.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t("entrevista.historialVacio")}
        </Typography>
      )}
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {(sessions ?? []).map((session) => (
          <Box component="li" key={session.recordedAt}>
            <Typography variant="caption" color="text.secondary">
              {formatSessionDate(session.recordedAt)}
            </Typography>
            {session.entries.map((entry) => (
              <Typography key={entry.categoryId} variant="body2">
                {labels.name(entry.categoryName)}:{" "}
                {entry.previousScore !== undefined ? `${entry.previousScore} → ${entry.score}` : entry.score}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
