import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useTranslation } from "react-i18next";
import type { CategoryLabel } from "@modules/categories/ui/categoryLabels";
import type { CategoryDto } from "@modules/categories/ui/queries";

interface CategoryPickerProps {
  categories: CategoryDto[];
  categoryLabel: (catalogId: string | undefined) => CategoryLabel;
  pendingCategoryIds: ReadonlySet<string>;
  onToggle: (category: CategoryDto) => void;
  onToggleAllRegular: () => void;
}

/**
 * UX-07, paso 2 de la primera entrevista: elegir categorías con botones grandes
 * (nombre y descripción) que se marcan al tocarlos, en lugar de casillas. Elegir
 * una la activa al momento (RF-07); las sensibles van aparte y piden su
 * consentimiento al elegirlas (RF-04), como en la entrevista de siempre.
 */
export function CategoryPicker({ categories, categoryLabel, pendingCategoryIds, onToggle, onToggleAllRegular }: CategoryPickerProps) {
  const { t } = useTranslation();
  const regularCategories = categories.filter((category) => !category.isSensitiveData);
  const sensitiveCategories = categories.filter((category) => category.isSensitiveData);
  const allRegularActive = regularCategories.length > 0 && regularCategories.every((category) => category.status === "active");

  const renderOption = (category: CategoryDto) => {
    const isActive = category.status === "active";
    const label = categoryLabel(category.catalogId);
    return (
      <ButtonBase
        key={category.id}
        aria-pressed={isActive}
        onClick={() => onToggle(category)}
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
          textAlign: "left",
          gap: 1.25,
          p: 1.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isActive ? "primary.main" : "#D5DBDF",
          bgcolor: isActive ? "#E3E9ED" : "#FFFFFF",
          transition: "background-color 150ms, border-color 150ms",
          "&:hover, &:focus-visible": { borderColor: "primary.main" },
        }}
      >
        {isActive ? <CheckCircleIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} /> : <RadioButtonUncheckedIcon color="action" fontSize="small" sx={{ mt: 0.25 }} />}
        <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="span" variant="body1" sx={{ display: "block", fontWeight: isActive ? 600 : 400 }}>
            {label.name}
          </Typography>
          {label.description && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {label.description}
            </Typography>
          )}
        </Box>
        {pendingCategoryIds.has(category.id) && category.isSensitiveData && <CircularProgress size={16} aria-label={label.name} />}
      </ButtonBase>
    );
  };

  const optionsGrid = (list: CategoryDto[]) => <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>{list.map(renderOption)}</Box>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" component="h3">
            {t("entrevista.elegirTitulo")}
          </Typography>
          <Button size="small" onClick={onToggleAllRegular}>
            {allRegularActive ? t("entrevista.quitarTodas") : t("entrevista.elegirTodas")}
          </Button>
        </Box>
        {optionsGrid(regularCategories)}
      </Box>
      <Box sx={{ bgcolor: "#F8F7F9", borderRadius: 0, p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="subtitle1" component="h3">
          {t("entrevista.sensiblesTitulo")}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {t("entrevista.sensiblesExplicacion")}
        </Typography>
        {optionsGrid(sensitiveCategories)}
      </Box>
    </Box>
  );
}
