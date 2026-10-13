import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { useTranslation } from "react-i18next";
import type { ScoreFeedback } from "../scoreFeedback";

const VISIBLE_MS = 5000;

export interface ScoreFeedbackMessage extends ScoreFeedback {
  categoryName: string;
  score: number;
}

/**
 * UX-09: el mensaje al guardar una puntuación alta, en un aviso que se cierra solo a los
 * 5 segundos o con su botón. No es información que haga falta releer (lo que sí, como la
 * oferta de compartir, sigue además en la pantalla), así que puede desaparecer. Se anuncia
 * a los lectores de pantalla sin interrumpir (`role="status"`).
 */
export function ScoreFeedbackToast({ feedback, onClose }: { feedback: ScoreFeedbackMessage | undefined; onClose: () => void }) {
  const { t } = useTranslation();
  if (!feedback) return null;
  const key = `entrevista.puntuacionAlta.${feedback.tone}${feedback.inviteToShare ? "Compartir" : ""}`;

  return (
    <Snackbar
      open
      autoHideDuration={VISIBLE_MS}
      // Un clic fuera no lo cierra: se va solo o con su botón.
      onClose={(_event, reason) => reason !== "clickaway" && onClose()}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert role="status" severity="success" variant="filled" icon={false} onClose={onClose} closeText={t("comun.cerrar")} sx={{ bgcolor: "primary.main", color: "primary.contrastText", maxWidth: 520 }}>
        {t(key, { categoria: feedback.categoryName, puntuacion: feedback.score })}
      </Alert>
    </Snackbar>
  );
}
