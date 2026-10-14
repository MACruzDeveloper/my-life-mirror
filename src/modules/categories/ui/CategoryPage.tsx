import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useParams } from "react-router";
import { useExperiences, useLatestScores } from "@modules/assessments/ui/queries";
import { TripsSection } from "@modules/agenda/ui/trips/TripsSection";
import { ProtectedLayout } from "@shared/ui/components/ProtectedLayout";
import { useCategoryLabel } from "./categoryLabels";
import { hasCategoryPage } from "./categoryPages";
import { useCategories, useCategoryLabelsQuery } from "./queries";

/**
 * La ruta de una página de categoría, con su miga de pan: "Inicio / Categorías /
 * Aventura" (el nombre de la categoría en el idioma de la interfaz, no un
 * genérico).
 */
export function CategoryPageRoute() {
  const { t } = useTranslation();
  const { key } = useParams();
  const { categoryLabel } = useCategoryLabel();
  const entry = (useCategoryLabelsQuery().data ?? []).find((candidate) => candidate.key === key);
  const name = entry ? categoryLabel(entry.catalogId).name : "";
  return (
    <ProtectedLayout breadcrumbs={[{ label: t("breadcrumbs.inicio"), path: "/inicio" }, { label: t("breadcrumbs.categorias"), path: "/categorias" }, { label: name || t("breadcrumbs.categoria") }]}>
      <CategoryPage />
    </ProtectedLayout>
  );
}

const SECTION_SX = { p: 2.5, borderRadius: 0, border: 1, borderColor: "divider", bgcolor: "background.paper" };

/**
 * RF-49: la página de una categoría, con lo que la persona ha vivido en ella.
 * Lo común a todas: la descripción, la última nota (con enlace a la
 * entrevista) y las experiencias del diario. Lo propio de cada una va debajo:
 * en Aventura, los viajes. Nada de esta página cambia una puntuación.
 */
export function CategoryPage() {
  const { t } = useTranslation();
  const { key } = useParams();
  const labels = useCategoryLabelsQuery();
  const { categoryLabel } = useCategoryLabel();

  if (labels.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const entry = (Array.isArray(labels.data) ? labels.data : []).find((candidate) => candidate.key === key);
  if (!entry || !hasCategoryPage(key)) {
    return (
      <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3, px: 2 }}>
        <Typography variant="body1" gutterBottom>
          {t("paginasCategoria.sinPagina")}
        </Typography>
        <Link component={RouterLink} to="/categorias">
          {t("paginasCategoria.verTodas")}
        </Link>
      </Box>
    );
  }

  const label = categoryLabel(entry.catalogId);
  return (
    <>
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3, px: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {label.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {label.description}
        </Typography>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2 }}>
        <LatestScore catalogId={entry.catalogId} categoryName={label.name} />
        <DiaryEntries catalogId={entry.catalogId} />
      </Box>
    </Box>
    {/* Lo propio de cada categoría, a todo lo ancho de la página. */}
    {key === "aventura" && <TripsSection />}
    </>
  );
}

function LatestScore({ catalogId, categoryName }: { catalogId: string; categoryName: string }) {
  const { t, i18n } = useTranslation();
  const latest = (useLatestScores().data ?? []).find((score) => score.catalogId === catalogId && score.score !== undefined);
  return (
    <Box component="section" aria-label={t("paginasCategoria.tuNota")} sx={SECTION_SX}>
      {/* El título y, a su derecha, la nota en grande. */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
          {t("paginasCategoria.tuNota")}
        </Typography>
        {latest && (
          <Typography variant="h2" component="p" sx={{ fontWeight: 700, lineHeight: 1, color: "secondary.main" }}>
            {latest.score}
          </Typography>
        )}
      </Box>
      {latest ? (
        <>
          {latest.recordedAt && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("paginasCategoria.puntuadaEl", { fecha: new Date(latest.recordedAt).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" }) })}
            </Typography>
          )}
          <Button component={RouterLink} to="/perfil/entrevista" size="small" variant="contained" color="secondary" sx={{ mt: 1 }}>
            {t("entrevista.actualizarRespuestas")}
          </Button>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
            {t("paginasCategoria.sinNota")}
          </Typography>
          <Button component={RouterLink} to="/perfil/entrevista" size="small" variant="contained" color="secondary">
            {t("paginasCategoria.puntuar", { categoria: categoryName })}
          </Button>
        </>
      )}
    </Box>
  );
}

/** Las experiencias del diario (RF-44) en esta categoría, de la más reciente a la más antigua. */
function DiaryEntries({ catalogId }: { catalogId: string }) {
  const { t, i18n } = useTranslation();
  const categoryIds = new Set((useCategories().data ?? []).filter((category) => category.catalogId === catalogId).map((category) => category.id));
  const experiences = (useExperiences().data ?? []).filter((experience) => categoryIds.has(experience.categoryId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Box component="section" aria-label={t("paginasCategoria.tusExperiencias")} sx={SECTION_SX}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
        {t("paginasCategoria.tusExperiencias")}
      </Typography>
      {experiences.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t("paginasCategoria.sinExperiencias")}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {experiences.slice(0, 5).map((experience) => (
            <Box component="li" key={experience.id} sx={{ borderLeft: 3, borderColor: "primary.main", pl: 1.5 }}>
              <Typography variant="caption" color="text.secondary" component="p">
                {new Date(experience.createdAt).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" })}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
                {experience.text}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
