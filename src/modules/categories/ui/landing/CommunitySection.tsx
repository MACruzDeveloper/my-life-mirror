import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { useTranslation } from "react-i18next";
import { PAGE_MAX_WIDTH } from "@shared/ui/components/Breadcrumbs";
import { useReportSharedExperience, useSharedExperiences } from "@modules/assessments/ui/queries";

/** Las tres primeras: la página no es un muro; el resto sigue en la ventana de ideas. */
const SHOWN = 3;

/**
 * RF-43 en las páginas de categoría: "De la comunidad", lo que comparten de
 * forma anónima otras personas a las que les va bien en esta área (solo el
 * texto). Mismo trato que en la ventana de ideas: aviso de que no es consejo
 * profesional (RES-05) y reportar la oculta al momento. La ayuda de RF-30 la
 * pone el pie de toda página protegida, justo debajo (en la ventana de ideas va dentro).
 */
export function CommunitySection({ categoryId }: { categoryId: string | undefined }) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const shared = useSharedExperiences(categoryId, i18n.language, true);
  const report = useReportSharedExperience(categoryId ?? "", i18n.language);
  const [reported, setReported] = useState(false);
  const [failed, setFailed] = useState(false);
  const experiences = (Array.isArray(shared.data) ? shared.data : []).slice(0, SHOWN);

  async function handleReport(id: string) {
    setFailed(false);
    const done = await report(id);
    setReported(done);
    setFailed(!done);
  }

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ maxWidth: PAGE_MAX_WIDTH, mx: "auto", px: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ForumOutlinedIcon color="primary" />
        <Typography id={titleId} variant="h6" component="h2">
          {t("comunidad.titulo")}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {t("comunidad.intro")}
      </Typography>
      {shared.isPending && categoryId ? null : experiences.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2.5, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          {t("comunidad.ninguna")}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
          {experiences.map((experience) => (
            <Box component="li" key={experience.id} sx={{ display: "flex", flexDirection: "column", p: 2.5, border: 1, borderColor: "divider", borderLeft: 3, borderLeftColor: "secondary.main", bgcolor: "background.paper" }}>
              <FormatQuoteIcon color="secondary" aria-hidden sx={{ mb: 0.5 }} />
              <Typography variant="body2" sx={{ flex: 1, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
                {experience.text}
              </Typography>
              <Button size="small" color="inherit" startIcon={<FlagOutlinedIcon fontSize="small" />} onClick={() => void handleReport(experience.id)} sx={{ alignSelf: "flex-end", mt: 1, textTransform: "none", color: "text.secondary" }}>
                {t("recomendaciones.reportar")}
              </Button>
            </Box>
          ))}
        </Box>
      )}
      <Box aria-live="polite">
        {reported && (
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            {t("recomendaciones.reportada")}
          </Typography>
        )}
        {failed && (
          <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
            {t("recomendaciones.errorReportar")}
          </Typography>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("recomendaciones.avisoOtros")}
      </Typography>
    </Box>
  );
}
