import { useId } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import type { CategoryLabel } from "@modules/categories/ui/categoryLabels";
import type { CategoryDto } from "@modules/categories/ui/queries";

interface CategorySelectionProps {
  categories: CategoryDto[];
  categoryLabel: (catalogId: string | undefined) => CategoryLabel;
  pendingCategoryIds: ReadonlySet<string>;
  onToggle: (category: CategoryDto) => void;
  onToggleAllRegular: () => void;
}

// El color va después de `border` (la abreviatura lo pondría en negro).
const GROUP_STYLES = {
  regular: { bgcolor: "#FFFFFF", borderColor: "#DCDFE1" },
  sensitive: { bgcolor: "#F7F8F9", borderColor: "#D5DBDF" },
};

/**
 * Elegir qué categorías se siguen (RF-07): las que no necesitan consentimiento,
 * con "Seleccionar todas", y las sensibles aparte (RF-04, una a una), en dos
 * acordeones plegados con cuántas hay activas (UX-06), para dejar sitio a las
 * preguntas. En la primera entrevista se eligen antes, en su paso (UX-07).
 */
export function CategorySelection({ categories, categoryLabel, pendingCategoryIds, onToggle, onToggleAllRegular }: CategorySelectionProps) {
  const { t } = useTranslation();
  const regularTitleId = useId();
  const sensitiveTitleId = useId();
  const regularCategories = categories.filter((category) => !category.isSensitiveData);
  const sensitiveCategories = categories.filter((category) => category.isSensitiveData);
  const activeCount = (list: CategoryDto[]) => list.filter((category) => category.status === "active").length;
  const allRegularActive = regularCategories.length > 0 && activeCount(regularCategories) === regularCategories.length;
  const anyRegularActive = activeCount(regularCategories) > 0;

  const renderCategoryRow = (category: CategoryDto) => (
    <Box key={category.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FormControlLabel
        control={<Checkbox checked={category.status === "active"} onChange={() => onToggle(category)} />}
        label={
          <Box>
            <Typography variant="body1" component="span">
              {categoryLabel(category.catalogId).name}
            </Typography>
            {categoryLabel(category.catalogId).description && (
              <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block" }}>
                {categoryLabel(category.catalogId).description}
              </Typography>
            )}
          </Box>
        }
      />
      {pendingCategoryIds.has(category.id) && category.isSensitiveData && <CircularProgress size={16} aria-label={categoryLabel(category.catalogId).name} />}
    </Box>
  );

  const regularList = (
    <Box role="group" aria-labelledby={regularTitleId}>
      <FormControlLabel
        control={<Checkbox checked={allRegularActive} indeterminate={anyRegularActive && !allRegularActive} onChange={onToggleAllRegular} />}
        label={t("entrevista.seleccionarTodas")}
      />
      <Box sx={{ display: "flex", flexDirection: "column", pl: 3 }}>{regularCategories.map(renderCategoryRow)}</Box>
    </Box>
  );

  const sensitiveList = (
    <Box role="group" aria-labelledby={sensitiveTitleId}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {t("entrevista.sensiblesExplicacion")}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column" }}>{sensitiveCategories.map(renderCategoryRow)}</Box>
    </Box>
  );

  const accordion = (titleId: string, title: string, list: CategoryDto[], content: React.ReactNode, styles: (typeof GROUP_STYLES)["regular"]) => (
    // Sin borde ni sombra: el fondo basta para separar cada acordeón (el de las libres, gris claro
    // en vez de blanco, para que se distinga sobre la página).
    <Accordion disableGutters elevation={0} sx={{ bgcolor: styles === GROUP_STYLES.regular ? "#F2F2F2" : styles.bgcolor, borderRadius: 3, "&::before": { display: "none" }, overflow: "hidden" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography id={titleId} variant="subtitle1" component="span" sx={{ display: "block" }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("entrevista.activasResumen", { activas: activeCount(list), total: list.length })}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{content}</AccordionDetails>
    </Accordion>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {accordion(regularTitleId, t("entrevista.elegirTitulo"), regularCategories, regularList, GROUP_STYLES.regular)}
      {accordion(sensitiveTitleId, t("entrevista.sensiblesTitulo"), sensitiveCategories, sensitiveList, GROUP_STYLES.sensitive)}
    </Box>
  );
}
