import { useId } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { RecommendationButton } from "@modules/recommendations/ui/RecommendationButton";

export interface IdeaSummaryItem {
  id: string;
  /** Para volver a pedir la idea personalizada si cambia "¿Qué te ayuda?" (RF-40 v1.1). */
  categoryId?: string;
  templateKey: string;
  /** Clave de la categoría en el catálogo: decide qué ideas ofrece el carrusel. */
  categoryKey?: string;
  /** Nombre ya en el idioma de la interfaz. */
  categoryName: string;
}

/**
 * UX-02. Las recomendaciones abiertas, resumidas arriba del panel: en la
 * validación no se encontraban al pie de cada tarjeta. Cada botón abre la
 * misma ventana que el de la tarjeta (con el aviso de RES-05); nada se abre
 * solo (RES-07). Sin recomendaciones no se muestra.
 */
export function IdeasSummary({ ideas, personalize = false }: { ideas: IdeaSummaryItem[]; personalize?: boolean }) {
  const { t } = useTranslation();
  const headingId = useId();

  if (ideas.length === 0) return null;

  return (
    <Box component="section" aria-labelledby={headingId} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#FFFBEB", border: 1, borderColor: "#F1D98A" }}>
      <Typography id={headingId} variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
        {t("recomendaciones.resumenTitulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t("recomendaciones.resumenTexto")}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {ideas.map((idea) => (
          <RecommendationButton
            recommendationId={idea.id}
            categoryId={idea.categoryId}
            categoryKey={idea.categoryKey}
            personalize={personalize}
            key={idea.id}
            templateKey={idea.templateKey}
            categoryName={idea.categoryName}
            label={t("recomendaciones.ideaPara", { categoria: idea.categoryName })}
          />
        ))}
      </Box>
    </Box>
  );
}
