import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { ScoreFeedback } from "../scoreFeedback";

const VISIBLE_MS = 5000;

/**
 * El mensaje que se enseña al guardar: el de una nota alta (UX-09) o, si con
 * esa nota todas las categorías quedan en verde, el de RF-50, que enlaza a las
 * ideas para disfrutar de Inicio.
 */
export type ScoreFeedbackMessage = (ScoreFeedback & { kind?: "score"; categoryName: string; score: number }) | { kind: "balanced" };

/**
 * UX-09: el mensaje al guardar una puntuación alta, en un aviso que se cierra solo a los
 * 5 segundos o con su botón. No es información que haga falta releer (lo que sí, como la
 * oferta de compartir, sigue además en la pantalla), así que puede desaparecer. Se anuncia
 * a los lectores de pantalla sin interrumpir (`role="status"`).
 */
export function ScoreFeedbackToast({ feedback, onClose }: { feedback: ScoreFeedbackMessage | undefined; onClose: () => void }) {
  const { t } = useTranslation();
  if (!feedback) return null;
  const balanced = feedback.kind === "balanced";
  const text = balanced ? t("entrevista.todoEnVerde") : t(`entrevista.puntuacionAlta.${feedback.tone}${feedback.inviteToShare ? "Compartir" : ""}`, { categoria: feedback.categoryName, puntuacion: feedback.score });

  return (
    <Snackbar
      open
      autoHideDuration={VISIBLE_MS}
      // Un clic fuera no lo cierra: se va solo o con su botón.
      onClose={(_event, reason) => reason !== "clickaway" && onClose()}
      anchorOrigin={{ vertical: balanced ? "top" : "bottom", horizontal: "center" }}
      // RF-50: "todo en verde" es un momento especial: en el centro de la pantalla, para que destaque.
      // Con valores por tamaño: MUI fija su propia posición a partir de `sm` y, sin ellos, ganaba la suya.
      sx={balanced ? { top: { xs: "50%", sm: "50%" }, bottom: { xs: "auto", sm: "auto" }, left: { xs: "50%", sm: "50%" }, right: { xs: "auto", sm: "auto" }, transform: { xs: "translate(-50%, -50%)", sm: "translate(-50%, -50%)" }, width: { xs: "calc(100% - 32px)", sm: "auto" } } : undefined}
    >
      <Alert
        role="status"
        severity="success"
        variant="filled"
        icon={false}
        onClose={balanced ? undefined : onClose}
        closeText={t("comun.cerrar")}
        // RF-50: con todo en verde, un enlace a Inicio en lugar del botón de cerrar (se cierra igual, solo).
        action={
          balanced ? (
            <Button component={RouterLink} to="/inicio" color="inherit" size="small" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              {t("entrevista.verIdeasInicio")}
            </Button>
          ) : undefined
        }
        sx={{ bgcolor: "primary.main", color: "primary.contrastText", maxWidth: 560, alignItems: "center", ...(balanced && { py: 1.5, px: 2.5, fontSize: "1rem", boxShadow: 8 }) }}
      >
        {text}
      </Alert>
    </Snackbar>
  );
}
