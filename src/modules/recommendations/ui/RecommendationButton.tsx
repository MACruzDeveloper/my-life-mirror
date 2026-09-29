import { useId, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

/** Tono "idea" amarillo suave: destaca sin sonar a aviso ni a error (RN-04, RES-07). */
const IDEA_COLORS = { background: "#FFF6D6", text: "#6B4E00", border: "#F1D98A", hoverBackground: "#FDEFBE" };

interface RecommendationButtonProps {
  templateKey: string;
  /** Nombre ya en el idioma de la interfaz (lo resuelve la página). */
  categoryName: string;
  /** Texto del botón; por defecto "Una idea para ti" (el resumen de Inicio lo nombra por su categoría). */
  label?: string;
}

/**
 * Recomendación de una categoría (RF-18): en la tarjeta solo se ve un botón
 * destacado "Una idea para ti", para que el usuario sepa que hay una propuesta
 * sin llenarle la pantalla de texto; la idea y el aviso de RES-05 se leen en
 * una ventana al pulsarlo. Sin ventanas que se abran solas (RES-07).
 */
export function RecommendationButton({ templateKey, categoryName, label }: RecommendationButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const titleId = useId();

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
          <DialogContentText sx={{ color: "text.primary", mb: 2 }}>{t(`recomendaciones.plantillas.${templateKey}`, { categoria: categoryName })}</DialogContentText>
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
