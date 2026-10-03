import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { useTranslation } from "react-i18next";
import { usePersonalizedIdea } from "./queries";

/** Tono "idea" amarillo suave: destaca sin sonar a aviso ni a error (RN-04, RES-07). */
const IDEA_COLORS = { background: "#FFF6D6", text: "#6B4E00", border: "#F1D98A", hoverBackground: "#FDEFBE" };

interface RecommendationButtonProps {
  templateKey: string;
  /** Nombre ya en el idioma de la interfaz (lo resuelve la página). */
  categoryName: string;
  /** Texto del botón; por defecto "Una idea para ti" (el resumen de Inicio lo nombra por su categoría). */
  label?: string;
  /** RF-40: id de la recomendación, para pedir su versión personalizada. */
  recommendationId?: string;
  /** RF-40: la función está disponible y el usuario la activó (lo decide la página con `useAiIdeasActive`). */
  personalize?: boolean;
}

/**
 * Recomendación de una categoría (RF-18): en la tarjeta solo se ve un botón
 * destacado "Una idea para ti", para que el usuario sepa que hay una propuesta
 * sin llenarle la pantalla de texto; la idea y el aviso de RES-05 se leen en
 * una ventana al pulsarlo. Sin ventanas que se abran solas (RES-07).
 * RF-40: si el usuario activó las ideas con IA, la ventana pide la versión
 * personalizada (la primera vez tarda un poco; luego sale de la caché) y la
 * muestra con su etiqueta y la idea original a un clic. Ante cualquier
 * respuesta que no sea una idea de IA, se ve el texto curado de siempre.
 */
export function RecommendationButton({ templateKey, categoryName, label, recommendationId, personalize = false }: RecommendationButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const curatedText = t(`recomendaciones.plantillas.${templateKey}`, { categoria: categoryName });

  return (
    <>
      <Button
        size="small"
        startIcon={<LightbulbOutlinedIcon fontSize="small" />}
        aria-haspopup="dialog"
        data-highlighted="true"
        onClick={() => setOpen(true)}
        sx={{
          alignSelf: "flex-start",
          mt: 0.5,
          px: 1.5,
          borderRadius: 999,
          border: "1px solid",
          borderColor: IDEA_COLORS.border,
          bgcolor: IDEA_COLORS.background,
          color: IDEA_COLORS.text,
          fontWeight: 600,
          textTransform: "none",
          "&:hover": { bgcolor: IDEA_COLORS.hoverBackground },
        }}
      >
        {label ?? t("recomendaciones.titulo")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby={titleId} fullWidth maxWidth="xs">
        <DialogTitle id={titleId}>{t("recomendaciones.dialogoTitulo", { categoria: categoryName })}</DialogTitle>
        <DialogContent>
          {personalize && recommendationId ? (
            <PersonalizedIdea recommendationId={recommendationId} categoryName={categoryName} curatedText={curatedText} />
          ) : (
            <DialogContentText sx={{ color: "text.primary", mb: 2 }}>{curatedText}</DialogContentText>
          )}
          <Typography variant="caption" color="text.secondary" component="p">
            {t("recomendaciones.aviso")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("recomendaciones.cerrar")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Solo se monta con la ventana abierta: la petición se hace al abrir, no al pintar la tarjeta. */
function PersonalizedIdea({ recommendationId, categoryName, curatedText }: { recommendationId: string; categoryName: string; curatedText: string }) {
  const { t, i18n } = useTranslation();
  const [showOriginal, setShowOriginal] = useState(false);
  const { data, isPending } = usePersonalizedIdea(recommendationId, i18n.language, true);

  if (isPending) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          {t("recomendaciones.personalizando")}
        </Typography>
      </Box>
    );
  }

  if (data?.source !== "ai") {
    return <DialogContentText sx={{ color: "text.primary", mb: 2 }}>{curatedText}</DialogContentText>;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Chip icon={<AutoAwesomeOutlinedIcon fontSize="small" />} label={t("recomendaciones.personalizadaConIa")} size="small" variant="outlined" sx={{ mb: 1 }} />
      <DialogContentText sx={{ color: "text.primary" }}>{data.text}</DialogContentText>
      <Link component="button" type="button" variant="body2" onClick={() => setShowOriginal((current) => !current)} sx={{ mt: 1 }}>
        {showOriginal ? t("recomendaciones.ocultarOriginal") : t("recomendaciones.verOriginal")}
      </Link>
      {showOriginal && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t(`recomendaciones.plantillas.${data.templateKey}`, { categoria: categoryName })}
        </Typography>
      )}
    </Box>
  );
}
