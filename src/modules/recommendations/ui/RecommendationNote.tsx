import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

/**
 * Nota discreta "Una idea para ti" dentro de la tarjeta de una categoría
 * (RF-18). Tono de sugerencia, nunca de reproche (RN-04, RES-07): sin colores
 * de alarma ni iconos de aviso. El texto sale de la clave de plantilla, en el
 * idioma de la interfaz.
 */
export function RecommendationNote({ templateKey, categoryName }: { templateKey: string; categoryName: string }) {
  const { t } = useTranslation();

  return (
    <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {t("recomendaciones.titulo")}
      </Typography>
      <Typography variant="body2">{t(`recomendaciones.plantillas.${templateKey}`, { categoria: categoryName })}</Typography>
    </Box>
  );
}

/** Aviso fijo de RES-05: se muestra junto a las recomendaciones. */
export function RecommendationDisclaimer() {
  const { t } = useTranslation();
  return (
    <Typography variant="caption" color="text.secondary" component="p">
      {t("recomendaciones.aviso")}
    </Typography>
  );
}
