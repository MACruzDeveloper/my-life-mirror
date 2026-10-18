import { useId } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { type ScoredCategory, staleCategories } from "./staleCategories";

/**
 * UX-10: una invitación a volver a mirar las categorías que llevan tiempo sin
 * actualizarse. Salió de la segunda prueba con una usuaria: que una categoría
 * que iba bien no se dé por olvidada. Invita, no avisa: dice cuánto hace y
 * pregunta si sigue igual, sin urgencia ni reproche ("un espejo, no un
 * examen"). Sin notificaciones: solo se ve al entrar en Inicio.
 */
export function CheckInReminder({ latestScores, now = new Date() }: { latestScores: readonly ScoredCategory[]; now?: Date }) {
  const { t } = useTranslation();
  const titleId = useId();
  const stale = staleCategories(latestScores, now);
  if (stale.length === 0) return null;

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ p: 2.5, borderRadius: 0, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
      <Typography id={titleId} variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
        {t("recordatorio.titulo")}
      </Typography>
      <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
        {stale.map((item) => (
          <Typography key={item.categoryId} component="li" variant="body2">
            {t("recordatorio.item", { categoria: item.categoryName, count: item.weeks })}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 2, rowGap: 1, mt: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t("recordatorio.pregunta", { count: stale.length })}
        </Typography>
        <Button component={RouterLink} to="/perfil/entrevista" size="small" variant="outlined">
          {t("entrevista.actualizarRespuestas")}
        </Button>
      </Box>
    </Box>
  );
}
