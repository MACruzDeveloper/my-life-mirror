import { useId } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { IdeaContent } from "@modules/recommendations/ui/RecommendationButton";
import type { RecommendationDto } from "@modules/recommendations/ui/queries";

interface SavedIdeaDialogProps {
  /** La idea nueva que ha abierto el guardado; sin ella, la ventana está cerrada. */
  recommendation: RecommendationDto | null;
  categoryName: string;
  /** Clave de la categoría en el catálogo: decide qué ideas ofrece el carrusel. */
  categoryKey?: string;
  personalize: boolean;
  onClose: () => void;
}

/**
 * UX-05: "Cambios guardados" cuando el guardado de una categoría abre una idea
 * nueva (RF-18), con la idea, el aviso de RES-05 y los siguientes pasos. Es la
 * respuesta a una acción del usuario, no una ventana que se abre sola (RES-07).
 */
export function SavedIdeaDialog({ recommendation, categoryName, categoryKey, personalize, onClose }: SavedIdeaDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <Dialog open={recommendation !== null} onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="xs">
      <DialogTitle id={titleId}>{t("entrevista.guardadoTitulo")}</DialogTitle>
      {recommendation && (
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("entrevista.gracias")}
          </Typography>
          <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
            {t("entrevista.tienesIdea", { categoria: categoryName })}
          </Typography>
          <IdeaContent templateKey={recommendation.templateKey} categoryName={categoryName} recommendationId={recommendation.id} categoryId={recommendation.categoryId} categoryKey={categoryKey} personalize={personalize} />
        </DialogContent>
      )}
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button component={RouterLink} to="/perfil/resultados">
          {t("entrevista.verResultados")}
        </Button>
        <Button component={RouterLink} to="/inicio">
          {t("entrevista.irInicio")}
        </Button>
        <Button variant="contained" onClick={onClose}>
          {t("entrevista.seguirAqui")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
