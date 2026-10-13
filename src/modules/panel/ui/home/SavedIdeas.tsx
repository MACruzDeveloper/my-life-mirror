import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useTranslation } from "react-i18next";
import { IdeaPlan } from "@modules/recommendations/ui/IdeaPlan";
import { type IdeaReactionDto, useIdeaReactions, useSetIdeaReaction } from "@modules/recommendations/ui/ideaReactions";

/** RF-47: primero las que tienen fecha, de la más próxima a la más lejana; las que no, después, como estaban. */
function byPlanDate(a: IdeaReactionDto, b: IdeaReactionDto): number {
  if (a.plannedFor && b.plannedFor) return a.plannedFor.localeCompare(b.plannedFor);
  return a.plannedFor ? -1 : b.plannedFor ? 1 : 0;
}

/**
 * RF-19: las ideas que la persona guardó para no olvidarlas, en Inicio. Cada
 * una con su categoría y dos salidas: "Hecha" o "Quitar". Se muestra la idea
 * original del catálogo, en el idioma de la interfaz. Sin ideas guardadas no
 * se pinta nada. RF-47: cada una puede llevar una fecha orientativa, y salen
 * ordenadas por ella.
 */
export function SavedIdeas({ categoryNames }: { categoryNames: Record<string, string> }) {
  const { t } = useTranslation();
  const titleId = useId();
  const reactions = useIdeaReactions().data;
  const setIdeaReaction = useSetIdeaReaction();
  const [failed, setFailed] = useState(false);
  const saved = (Array.isArray(reactions) ? reactions : []).filter((reaction) => reaction.reaction === "saved").sort(byPlanDate);
  if (saved.length === 0) return null;

  async function react(categoryId: string, templateKey: string, reaction: "saved" | "done" | null, plannedFor?: string | null) {
    setFailed(!(await setIdeaReaction(categoryId, templateKey, reaction, plannedFor)));
  }

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <BookmarkIcon fontSize="small" color="primary" />
        <Typography id={titleId} variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
          {t("ideasGuardadas.titulo")}
        </Typography>
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {saved.map((idea) => {
          const categoryName = categoryNames[idea.categoryId] ?? "";
          return (
            <Box component="li" key={`${idea.categoryId}-${idea.templateKey}`} sx={{ borderLeft: 3, borderColor: "primary.main", pl: 1.5 }}>
              <Typography variant="caption" color="text.secondary" component="p">
                {categoryName}
              </Typography>
              <Typography variant="body1">{t(`recomendaciones.plantillas.${idea.templateKey}`, { categoria: categoryName })}</Typography>
              <IdeaPlan plannedFor={idea.plannedFor} onChange={(plannedFor) => void react(idea.categoryId, idea.templateKey, "saved", plannedFor)} />
              <Box sx={{ display: "flex", gap: 1, mt: 0.75 }}>
                <Button size="small" variant="outlined" onClick={() => void react(idea.categoryId, idea.templateKey, "done")}>
                  {t("ideasGuardadas.hecha")}
                </Button>
                <Button size="small" onClick={() => void react(idea.categoryId, idea.templateKey, null)}>
                  {t("ideasGuardadas.quitar")}
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>
      {failed && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {t("ideasGuardadas.error")}
        </Typography>
      )}
    </Box>
  );
}
