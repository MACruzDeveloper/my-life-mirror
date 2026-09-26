import { useId, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import SvgIcon from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useCategoryLabels } from "@modules/categories/ui/categoryLabels";

/** Tono "idea" amarillo suave: destaca sin sonar a aviso ni a error (RN-04, RES-07). */
const IDEA_COLORS = { background: "#FFF6D6", text: "#6B4E00", border: "#F1D98A", hoverBackground: "#FDEFBE" };

function LightbulbIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7" />
    </SvgIcon>
  );
}

interface RecommendationButtonProps {
  templateKey: string;
  categoryName: string;
}

/**
 * Recomendación de una categoría (RF-18): en la tarjeta solo se ve un botón
 * destacado "Una idea para ti", para que el usuario sepa que hay una propuesta
 * sin llenarle la pantalla de texto; la idea y el aviso de RES-05 se leen en
 * una ventana al pulsarlo. Sin ventanas que se abran solas (RES-07).
 */
export function RecommendationButton({ templateKey, categoryName }: RecommendationButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const displayName = useCategoryLabels().name(categoryName);

  return (
    <>
      <Button
        size="small"
        startIcon={<LightbulbIcon />}
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
        {t("recomendaciones.titulo")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby={titleId} fullWidth maxWidth="xs">
        <DialogTitle id={titleId}>{t("recomendaciones.dialogoTitulo", { categoria: displayName })}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.primary", mb: 2 }}>{t(`recomendaciones.plantillas.${templateKey}`, { categoria: displayName })}</DialogContentText>
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
