import { useId, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useExperienceSharing, useExperiences, type ExperienceDto } from "@modules/assessments/ui/queries";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { useCategories } from "@modules/categories/ui/queries";

/**
 * RF-43: las experiencias que el usuario ha compartido de forma anónima, con
 * "Dejar de compartir" en cada una (también se puede desde el diario). Lee la
 * misma caché que la entrevista.
 */
export function SharedExperiencesSection() {
  const { t } = useTranslation();
  const experiences = useExperiences().data;
  const shared = (Array.isArray(experiences) ? experiences : []).filter((experience) => experience.shared);
  const titleId = useId();

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="h6" component="h2" id={titleId}>
        {t("datos.compartidasTitulo")}
      </Typography>
      <Typography variant="body2">{t("datos.compartidasTexto")}</Typography>
      {shared.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("datos.compartidasNinguna")}
        </Typography>
      ) : (
        <SharedList experiences={shared} />
      )}
    </Box>
  );
}

/** Los nombres de las categorías solo hacen falta si hay alguna compartida: así no se piden si no. */
function SharedList({ experiences }: { experiences: ExperienceDto[] }) {
  const { t } = useTranslation();
  const categories = useCategories().data;
  const { categoryLabel } = useCategoryLabel();
  const { unshare } = useExperienceSharing();
  const [error, setError] = useState(false);
  const catalogIdOf = (categoryId: string) => (Array.isArray(categories) ? categories.find((category) => category.id === categoryId)?.catalogId : undefined);

  return (
    <>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        {experiences.map((experience) => (
          <Box component="li" key={experience.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography variant="caption" color="text.secondary" component="p">
              {categoryLabel(catalogIdOf(experience.categoryId)).name}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
              {experience.text}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                size="small"
                onClick={async () => {
                  setError(false);
                  if (!(await unshare(experience))) setError(true);
                }}
                sx={{ textTransform: "none" }}
              >
                {t("entrevista.dejarDeCompartir")}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
      {error && <Alert severity="error">{t("entrevista.errorDejarDeCompartir")}</Alert>}
    </>
  );
}
