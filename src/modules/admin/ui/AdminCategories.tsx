import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { getJson, HttpError } from "@shared/ui/api/getJson";
import { DEFAULT_LOCALE, isSupportedLocale, SUPPORTED_LOCALES, type Locale } from "@shared/domain/locales";
import { CATEGORIES_KEY } from "@modules/categories/ui/queries";
import { ASSESSMENTS_KEY } from "@modules/assessments/ui/queries";

interface CategoryTextDto {
  name: string;
  description: string;
}

interface CatalogDto {
  id: string;
  key?: string;
  translations: Partial<Record<Locale, CategoryTextDto>>;
  isSensitiveData: boolean;
  retiredAt?: string;
}

interface NewCategoryForm {
  translations: Record<Locale, CategoryTextDto>;
  isSensitiveData: boolean;
}

const emptyForm = (): NewCategoryForm => ({
  translations: Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, { name: "", description: "" }])) as Record<Locale, CategoryTextDto>,
  isSensitiveData: false,
});
const ADMIN_CATALOG_KEY = ["admin", "catalog"] as const;
const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 200;

const postJson = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/**
 * Gestión del catálogo de categorías (ADM-02): añadir y retirar. Una categoría
 * nueva se crea con nombre y descripción en **cada idioma soportado** (RNF-10):
 * el formulario y la tabla se generan a partir de `SUPPORTED_LOCALES`, así que
 * añadir un idioma añade sus campos sin tocar este componente. Solo refleja lo
 * que responde la API — el permiso lo decide el servidor.
 */
export function AdminCategories() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: ADMIN_CATALOG_KEY, queryFn: () => getJson<CatalogDto[]>("/api/admin/categories") });
  const [form, setForm] = useState<NewCategoryForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>();
  const [categoryToRetire, setCategoryToRetire] = useState<CatalogDto | null>(null);

  const interfaceLocale: Locale = isSupportedLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE;
  const languageName = (locale: Locale) => t(`idiomas.${locale}`);
  const isFormComplete = SUPPORTED_LOCALES.every((locale) => form.translations[locale].name.trim() && form.translations[locale].description.trim());
  const textIn = (category: CatalogDto, locale: Locale) => category.translations[locale] ?? category.translations[DEFAULT_LOCALE];

  function updateText(locale: Locale, field: keyof CategoryTextDto, value: string) {
    setForm((current) => ({ ...current, translations: { ...current.translations, [locale]: { ...current.translations[locale], [field]: value } } }));
  }

  /** Añadir/retirar cambia el catálogo y lo que ven los usuarios (la caché de esta misma sesión incluida). */
  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ADMIN_CATALOG_KEY }),
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY }),
    ]);
  }

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setActionError(undefined);
    try {
      const response = await fetch("/api/admin/categories", postJson(form));
      if (!response.ok) {
        const data = await response.json();
        setActionError(data.error ?? t("admin.errorGuardar"));
        return;
      }
      setForm(emptyForm());
      await refresh();
    } catch {
      setActionError(t("admin.errorGuardar"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmRetirement() {
    if (!categoryToRetire) return;
    const category = categoryToRetire;
    setCategoryToRetire(null);
    setActionError(undefined);
    try {
      const response = await fetch("/api/admin/categories/retire", postJson({ categoryId: category.id }));
      if (!response.ok) {
        const data = await response.json();
        setActionError(data.error ?? t("admin.errorGuardar"));
        return;
      }
      await refresh();
    } catch {
      setActionError(t("admin.errorGuardar"));
    }
  }

  if (catalog.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (catalog.error instanceof HttpError && catalog.error.status === 403) return <Alert severity="warning">{t("admin.sinPermiso")}</Alert>;
  if (catalog.isError) return <Alert severity="error">{t("admin.errorCarga")}</Alert>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="subtitle1">{t("admin.catalogoTitulo")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t("admin.catalogoAyuda")}
        </Typography>
      </Box>
      {actionError && <Alert severity="error">{actionError}</Alert>}

      <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {SUPPORTED_LOCALES.map((locale) => (
                <TableCell key={locale}>{t("admin.nombreEnIdioma", { idioma: languageName(locale) })}</TableCell>
              ))}
              <TableCell>{t("admin.descripcion")}</TableCell>
              <TableCell>{t("admin.estado")}</TableCell>
              <TableCell>{t("admin.acciones")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(catalog.data ?? []).map((category) => (
              <TableRow key={category.id} sx={category.retiredAt ? { opacity: 0.6 } : undefined}>
                {SUPPORTED_LOCALES.map((locale, index) => (
                  <TableCell key={locale} lang={locale}>
                    {category.translations[locale]?.name ?? "—"}
                    {index === 0 && category.isSensitiveData && <Chip size="small" label={t("admin.sensible")} sx={{ ml: 0.5 }} />}
                  </TableCell>
                ))}
                <TableCell>{textIn(category, interfaceLocale)?.description}</TableCell>
                <TableCell>{category.retiredAt ? t("admin.retirada") : t("admin.vigente")}</TableCell>
                <TableCell>
                  {!category.retiredAt && (
                    <Button size="small" color="warning" onClick={() => setCategoryToRetire(category)}>
                      {t("admin.retirar")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box component="form" onSubmit={addCategory} sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 760 }}>
        <Typography variant="subtitle1">{t("admin.anadirTitulo")}</Typography>
        {/* Una columna por idioma (apiladas en móvil): nombre y descripción de cada uno. */}
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: `repeat(${SUPPORTED_LOCALES.length}, 1fr)` } }}>
          {SUPPORTED_LOCALES.map((locale) => (
            <Box key={locale} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label={t("admin.nombreEnIdioma", { idioma: languageName(locale) })}
                value={form.translations[locale].name}
                onChange={(event) => updateText(locale, "name", event.target.value)}
                slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH, lang: locale } }}
                required
                size="small"
              />
              <TextField
                label={t("admin.descripcionEnIdioma", { idioma: languageName(locale) })}
                value={form.translations[locale].description}
                onChange={(event) => updateText(locale, "description", event.target.value)}
                slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH, lang: locale } }}
                required
                size="small"
                multiline
              />
            </Box>
          ))}
        </Box>
        <FormControlLabel
          control={<Checkbox checked={form.isSensitiveData} onChange={(event) => setForm((current) => ({ ...current, isSensitiveData: event.target.checked }))} />}
          label={t("admin.anadirDatosSensibles")}
        />
        <Box>
          <Button type="submit" variant="contained" disabled={isSubmitting || !isFormComplete}>
            {isSubmitting ? t("admin.anadiendo") : t("admin.anadir")}
          </Button>
        </Box>
      </Box>

      <Dialog open={categoryToRetire !== null} onClose={() => setCategoryToRetire(null)}>
        <DialogTitle>{t("admin.retirarTitulo", { nombre: categoryToRetire ? (textIn(categoryToRetire, interfaceLocale)?.name ?? "") : "" })}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("admin.retirarTexto")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryToRetire(null)}>{t("admin.cancelar")}</Button>
          <Button onClick={() => void confirmRetirement()} color="warning" variant="contained">
            {t("admin.retirarConfirmar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
