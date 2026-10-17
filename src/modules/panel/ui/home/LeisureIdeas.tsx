import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import { useTranslation } from "react-i18next";
import { LEISURE_IDEAS, isBalanced } from "@modules/recommendations/domain/leisureIdeas";
import { BAND_COLORS } from "@modules/assessments/ui/scoreBand";

/**
 * RF-50: cuando todas las categorías activas están en verde, Inicio deja de
 * proponer mejoras y ofrece ideas para disfrutar lo que ya hay (ocio,
 * autocuidado, un descanso de la propia app). Una idea a la vez, con "Otra
 * idea"; siempre del catálogo curado y con el aviso de RES-05. Si algo no está
 * en verde, no se pinta.
 */
export function LeisureIdeas({ scores }: { /** La última nota de cada categoría activa (sin valor si no tiene). */ scores: readonly (number | undefined)[] }) {
  const { t } = useTranslation();
  const titleId = useId();
  const [index, setIndex] = useState(0);
  if (!isBalanced(scores)) return null;

  const ideaNumber = LEISURE_IDEAS[index].split(".")[1];
  return (
    <Box component="section" aria-labelledby={titleId} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: "divider", bgcolor: "background.paper", borderLeft: 4, borderLeftColor: BAND_COLORS.mediumLow.fg }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <SpaOutlinedIcon color="secondary" />
        <Typography id={titleId} variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
          {t("recomendaciones.ocio.titulo")}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        {t("recomendaciones.ocio.texto")}
      </Typography>
      <Typography aria-live="polite" sx={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif', fontSize: { xs: "1.1rem", sm: "1.2rem" }, lineHeight: 1.4, color: "primary.main", mb: 2 }}>
        {t(`recomendaciones.ocio.ideas.${ideaNumber}`)}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        <Button variant="outlined" color="secondary" size="small" onClick={() => setIndex((current) => (current + 1) % LEISURE_IDEAS.length)}>
          {t("recomendaciones.ocio.otra")}
        </Button>
        <Typography variant="caption" color="text.secondary">
          {t("recomendaciones.ideaPosicion", { actual: index + 1, total: LEISURE_IDEAS.length })}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("recomendaciones.aviso")}
      </Typography>
    </Box>
  );
}
