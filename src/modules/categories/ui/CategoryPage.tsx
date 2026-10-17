import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { PALE_TINT, PALETTE } from "@shared/ui/theme";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useParams } from "react-router";
import { useExperiences, useLatestScores } from "@modules/assessments/ui/queries";
import { TripsSection } from "@modules/agenda/ui/trips/TripsSection";
import { MilestonesSection } from "@modules/agenda/ui/milestones/MilestonesSection";
import { ProtectedLayout } from "@shared/ui/components/ProtectedLayout";
import { useCategoryLabel } from "./categoryLabels";
import { hasCategoryPage } from "./categoryPages";
import { CATEGORY_HEROES } from "./categoryHeroes";
import { VideosSection } from "./landing/VideosSection";
import { SECTION_SPACING } from "./landing/landingLayout";
import { CommunitySection } from "./landing/CommunitySection";
import { useCategories, useCategoryLabelsQuery } from "./queries";

/**
 * La ruta de una página de categoría. Sin migas de pan: la página es una
 * landing con su imagen de cabecera pegada a la cabecera de la app, y las
 * migas encima de la imagen no quedaban bien (decisión del autor, 16 oct.).
 * Se vuelve con "Categorías" de la cabecera, que aquí va transparente encima
 * de la imagen (`overlayHeader`), y la imagen empieza en el borde superior.
 */
export function CategoryPageRoute() {
  return (
    <ProtectedLayout overlayHeader>
      <CategoryPage />
    </ProtectedLayout>
  );
}

/** La altura de la imagen de cabecera (pedida por el autor: 740 px en escritorio). */
const HERO_HEIGHT = { xs: 560, md: 740 };

/** Velo sobre la imagen: el azul noche de la paleta, más denso donde va el texto (arriba) que donde lo tapan las tarjetas (abajo). */
const HERO_VEIL = `linear-gradient(180deg, ${alpha(PALETTE.midnight, 0.6)} 0%, ${alpha(PALETTE.midnight, 0.6)} 60%, ${alpha(PALETTE.midnight, 0.3)} 100%)`;

/** Las dos tarjetas de arriba (nota y experiencias), en un gris suave de la paleta en lugar de blanco (decisión del autor). */
const SECTION_SX = { p: 2, borderRadius: 0, border: 1, borderColor: "divider", bgcolor: PALE_TINT };
/** Las experiencias que se ven sin desplegar: la tarjeta va encima de la imagen y no debe crecer sin control. */
const EXPERIENCES_SHOWN = 2;

/**
 * RF-49: la página de una categoría, con lo que la persona ha vivido en ella.
 * Lo común a todas: la descripción, la última nota (con enlace a la
 * entrevista) y las experiencias del diario. Lo propio de cada una va debajo:
 * en Aventura, los viajes y los retos superados; en Deporte, las carreras y
 * marcas (los hitos). Nada de esta página cambia una puntuación.
 */
export function CategoryPage() {
  const { t } = useTranslation();
  const { key } = useParams();
  const labels = useCategoryLabelsQuery();
  const categories = useCategories();
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
  const hero = CATEGORY_HEROES[key];
  // La copia de la categoría de esta persona (activa o no): con ella se piden las experiencias compartidas.
  const ownCategoryId = (categories.data ?? []).find((category) => category.catalogId === entry.catalogId)?.id;
  return (
    <>
    {/*
      La cabecera: la imagen de la categoría a todo lo ancho, detrás del título, con un velo oscuro de la
      paleta para que el texto blanco se lea. Las tarjetas van dentro, montadas sobre la parte baja de la
      imagen: el bloque mide lo que la imagen o, si las tarjetas son más largas, lo que ellas. Así el
      bloque siguiente nunca empieza encima de la imagen.
    */}
    <Box data-testid="category-hero" sx={{ position: "relative", overflow: "hidden", boxSizing: "border-box", minHeight: HERO_HEIGHT, pb: SECTION_SPACING }}>
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: HERO_HEIGHT }}>
        <picture>
          <source media="(min-width: 600px)" srcSet={hero.desktop} />
          <Box component="img" src={hero.mobile} alt="" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </picture>
        <Box aria-hidden sx={{ position: "absolute", inset: 0, background: HERO_VEIL }} />
        {/*
          Como en la portada: la imagen está generada con IA, y se dice. Abajo a la derecha de la imagen; en
          móvil las tarjetas la tapan por abajo, así que va arriba. El asterisco remite al disclaimer del pie.
        */}
        <Typography variant="caption" sx={{ position: "absolute", top: { xs: 68, md: "auto" }, bottom: { md: 8 }, right: 16, color: "common.white", opacity: 0.75 }}>
          {t("landing.imagenIA")}
          {hero.showsThirdPartyBrands && " *"}
        </Typography>
      </Box>
      {/* El título ocupa un alto fijo, abajo del todo, justo encima de las tarjetas: empiezan siempre a la misma altura. */}
      <Box sx={{ position: "relative", boxSizing: "border-box", height: { xs: 432, md: 516 }, maxWidth: 1100, mx: "auto", px: 2, pb: { xs: 3, md: 4 }, display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "common.white" }}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: "2.75rem", md: "4rem" }, lineHeight: 1, mb: 1 }}>
          {label.name}
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 640, fontSize: { md: "1.125rem" } }}>
          {label.description}
        </Typography>
      </Box>
      <Box sx={{ position: "relative", maxWidth: 1100, mx: "auto", px: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2 }}>
        <LatestScore catalogId={entry.catalogId} categoryName={label.name} />
        <DiaryEntries catalogId={entry.catalogId} />
      </Box>
    </Box>
    {/* Cada bloque, con el mismo espacio arriba y abajo. Lo propio de cada categoría primero: en Aventura, los viajes (el mapa, a todo lo ancho). */}
    {key === "aventura" && (
      <Box sx={{ py: SECTION_SPACING }}>
        <TripsSection />
      </Box>
    )}
    {/* Los hitos: en Aventura, después de los viajes; en Deporte, lo propio de la página. */}
    <Box sx={{ py: SECTION_SPACING }}>
      <MilestonesSection categoryKey={key} />
    </Box>
    {/* Inspiración: vídeos curados por el autor y lo que comparten otras personas (RF-43). */}
    {/* Con su propio espacio: sin vídeos, no ocupa sitio. */}
    <VideosSection categoryKey={key} />
    <Box sx={{ py: SECTION_SPACING }}>
      <CommunitySection categoryId={ownCategoryId} />
    </Box>
    {hero.showsThirdPartyBrands && (
      // Al pie: la imagen (generada con IA) muestra marcas que no tienen relación con la app.
      <Box component="aside" aria-labelledby="aviso-marcas" sx={{ maxWidth: 1100, mx: "auto", px: 2, pb: 2 }}>
        <Typography id="aviso-marcas" variant="caption" component="h2" sx={{ fontWeight: 700, display: "block" }}>
          * {t("paginasCategoria.avisoMarcasTitulo")}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p">
          {t("paginasCategoria.avisoMarcas")}
        </Typography>
      </Box>
    )}
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
          <Typography variant="h3" component="p" sx={{ fontWeight: 700, lineHeight: 1, color: "secondary.main" }}>
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

/**
 * Las experiencias del diario (RF-44) en esta categoría, de la más reciente a la más antigua.
 * Se ven las dos últimas; "Ver todas" despliega el resto en la misma tarjeta.
 */
function DiaryEntries({ catalogId }: { catalogId: string }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
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
        <>
        <Box component="ul" id={listId} sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {(expanded ? experiences : experiences.slice(0, EXPERIENCES_SHOWN)).map((experience) => (
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
        {experiences.length > EXPERIENCES_SHOWN && (
          <Button size="small" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded((current) => !current)} sx={{ mt: 1, px: 0.5 }}>
            {expanded ? t("paginasCategoria.verMenos") : t("paginasCategoria.verTodasExperiencias", { count: experiences.length })}
          </Button>
        )}
        </>
      )}
    </Box>
  );
}
