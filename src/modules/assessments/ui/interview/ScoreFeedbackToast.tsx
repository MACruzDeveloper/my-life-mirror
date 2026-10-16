import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import type { ScoreFeedback } from "../scoreFeedback";

const VISIBLE_MS = 5000;
/** Un resumen se queda dos segundos más por cada aviso que añade: da tiempo a leerlo. */
const EXTRA_MS_PER_ITEM = 2000;

/**
 * El mensaje que se enseña al guardar: el de una nota alta (UX-09) o, si con
 * esa nota todas las categorías quedan en verde, el de RF-50, que enlaza a las
 * ideas para disfrutar de Inicio; o, tras un "Guardar todo" (UX-12) con varios
 * avisos, un resumen con todos (ideas nuevas, notas altas, todo en verde), para
 * que no se pierda ninguno.
 */
export type ScoreFeedbackMessage =
  | (ScoreFeedback & { kind?: "score"; categoryName: string; score: number })
  | { kind: "balanced" }
  | { kind: "summary"; items: string[]; linkToHome: boolean; centered?: boolean };

/**
 * UX-09: el mensaje al guardar una puntuación alta, en un aviso que se cierra solo a los
 * 5 segundos o con su botón. No es información que haga falta releer (lo que sí, como la
 * oferta de compartir, sigue además en la pantalla), así que puede desaparecer. Se anuncia
 * a los lectores de pantalla sin interrumpir (`role="status"`).
 */
export function ScoreFeedbackToast({ feedback, onClose }: { feedback: ScoreFeedbackMessage | undefined; onClose: () => void }) {
  const { t } = useTranslation();
  if (!feedback) return null;
  const balanced = feedback.kind === "balanced" || (feedback.kind === "summary" && feedback.centered === true);
  const withLink = feedback.kind === "balanced" || (feedback.kind === "summary" && feedback.linkToHome);
  const duration = feedback.kind === "summary" ? VISIBLE_MS + EXTRA_MS_PER_ITEM * Math.max(feedback.items.length - 1, 0) : VISIBLE_MS;
  const text =
    feedback.kind === "balanced" ? (
      t("entrevista.todoEnVerde")
    ) : feedback.kind === "summary" ? (
      <Box component="ul" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {feedback.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Box>
    ) : (
      t(`entrevista.puntuacionAlta.${feedback.tone}${feedback.inviteToShare ? "Compartir" : ""}`, { categoria: feedback.categoryName, puntuacion: feedback.score })
    );

  return (
    <Snackbar
      open
      autoHideDuration={duration}
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
        onClose={withLink ? undefined : onClose}
        closeText={t("comun.cerrar")}
        // RF-50: con todo en verde, un enlace a Inicio en lugar del botón de cerrar (se cierra igual, solo).
        action={
          withLink ? (
            <Button component={RouterLink} to="/inicio" color="inherit" size="small" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              {t(feedback.kind === "balanced" ? "entrevista.verIdeasInicio" : "entrevista.verEnInicio")}
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
