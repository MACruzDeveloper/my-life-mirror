import { useRef, useState } from "react";
import { prefersReducedMotion } from "@shared/ui/motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { ADMIN_BLOCK_TITLE_SX, ADMIN_PANEL_SX, ADMIN_TABLE_HEAD_SX } from "./adminStyles";
import { useTranslation } from "react-i18next";
import { getJson } from "@shared/ui/api/getJson";
import { SUPPORTED_LOCALES } from "@shared/domain/locales";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { INSPIRATION_VIDEOS_KEY, type InspirationVideoDto, useCategoryLabelsQuery } from "@modules/categories/ui/queries";

const ADMIN_VIDEOS_KEY = ["admin", "videos"] as const;
/** El mismo límite que el caso de uso (el servidor lo vuelve a comprobar). */
const MAX_TITLE = 120;
const ROWS_PER_PAGE = [5, 10, 25];
/** "Todas" en el filtro: un valor propio (con "" el desplegable se ve vacío). */
const ALL = "all";

const EMPTY_FORM = { categoryKey: "", locale: "", youtubeUrl: "", title: "" };

/**
 * ADM-04: los vídeos de inspiración de las páginas de categoría, por categoría
 * e idioma. Añadir con el enlace de YouTube (el servidor guarda solo el
 * identificador), editar y borrar; la lista se filtra por categoría y se pagina.
 * Solo refleja lo que responde la API: el permiso lo decide el servidor.
 */
export function AdminVideos() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const videos = useQuery({ queryKey: ADMIN_VIDEOS_KEY, queryFn: ({ signal }) => getJson<InspirationVideoDto[]>("/api/admin/videos", signal) });
  const labels = useCategoryLabelsQuery();
  const { categoryLabel } = useCategoryLabel();
  const [form, setForm] = useState(EMPTY_FORM);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [filter, setFilter] = useState(ALL);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE[0]);

  // Solo las categorías con clave estable: las páginas de categoría se identifican por ella.
  const categories = (Array.isArray(labels.data) ? labels.data : []).flatMap((entry) => (entry.key ? [{ key: entry.key, name: categoryLabel(entry.catalogId).name }] : []));
  const categoryName = (key: string) => categories.find((category) => category.key === key)?.name ?? key;
  const languageName = (locale: string) => {
    const name = t(`idiomas.${locale}`, { defaultValue: locale });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  const filtered = (Array.isArray(videos.data) ? videos.data : [])
    .filter((video) => filter === ALL || video.categoryKey === filter)
    .sort((a, b) => categoryName(a.categoryKey).localeCompare(categoryName(b.categoryKey)) || a.locale.localeCompare(b.locale));
  // La página pedida, sin pasar de la última que existe (al borrar o cambiar el número de filas, nunca una página vacía).
  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const shown = filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
  const complete = Object.values(form).every((value) => value.trim().length > 0);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ADMIN_VIDEOS_KEY });
    void queryClient.invalidateQueries({ queryKey: INSPIRATION_VIDEOS_KEY });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(undefined);
  }

  function startEditing(video: InspirationVideoDto) {
    setError(undefined);
    setEditingId(video.id);
    setForm({ categoryKey: video.categoryKey, locale: video.locale, youtubeUrl: video.youtubeId, title: video.title });
    // El formulario está arriba: con la lista larga quedaba fuera de la vista y parecía que no pasaba nada.
    formRef.current?.scrollIntoView?.({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    titleRef.current?.focus({ preventScroll: true });
  }

  async function submit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!complete) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/admin/videos", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      if (response.ok) {
        resetForm();
        refresh();
      } else {
        setError(response.status === 409 ? t("admin.videos.errorRepetido") : response.status === 403 ? t("admin.sinPermiso") : t("admin.videos.errorDatos"));
      }
    } catch {
      setError(t("admin.videos.errorDatos"));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setError(undefined);
    try {
      const response = await fetch(`/api/admin/videos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("rejected");
      if (editingId === id) resetForm();
      refresh();
    } catch {
      setError(t("admin.videos.errorQuitar"));
    }
  }

  const field = (name: keyof typeof EMPTY_FORM) => ({
    value: form[name],
    onChange: (changeEvent: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [name]: changeEvent.target.value })),
  });
  const formTitle = editingId ? t("admin.videos.editarTitulo") : t("admin.videos.anadirTitulo");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        {t("admin.videos.intro")}
      </Typography>
      {/* Media anchura para todo: categoría e idioma arriba, el título y el enlace debajo, alineados con el idioma; el botón, a la derecha del enlace. */}
      <Box
        component="form"
        ref={formRef}
        onSubmit={submit}
        aria-label={formTitle}
        sx={{ ...ADMIN_PANEL_SX, borderColor: editingId ? "secondary.main" : "divider", p: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, columnGap: 2, rowGap: 1.5, alignItems: "start" }}
      >
        <Box sx={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 1 }}>
          <YouTubeIcon sx={{ color: "text.secondary" }} aria-hidden />
          <Typography variant="subtitle1" component="h2" sx={{ ...ADMIN_BLOCK_TITLE_SX, mb: 0 }}>
            {formTitle}
          </Typography>
        </Box>
        <Box sx={{ gridColumn: 1, display: "flex", flexWrap: { xs: "wrap", sm: "nowrap" }, gap: 1.5 }}>
          <TextField select label={t("admin.videos.categoria")} size="small" required sx={{ flex: 1, minWidth: 0 }} {...field("categoryKey")}>
            {categories.map((category) => (
              <MenuItem key={category.key} value={category.key}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label={t("admin.videos.idioma")} size="small" required sx={{ width: { xs: "100%", sm: 160 }, flexShrink: 0 }} {...field("locale")}>
            {SUPPORTED_LOCALES.map((locale) => (
              <MenuItem key={locale} value={locale}>
                {languageName(locale)}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField label={t("admin.videos.titulo")} inputRef={titleRef} size="small" required sx={{ gridColumn: 1 }} slotProps={{ htmlInput: { maxLength: MAX_TITLE } }} {...field("title")} />
        <TextField label={t("admin.videos.enlace")} size="small" required placeholder="https://www.youtube.com/watch?v=…" sx={{ gridColumn: 1 }} slotProps={{ htmlInput: { maxLength: 500 } }} {...field("youtubeUrl")} />
        <Box sx={{ gridColumn: { xs: 1, md: 2 }, gridRow: { md: 4 }, display: "flex", gap: 1 }}>
          <Button type="submit" variant="contained" color="secondary" disabled={!complete || submitting}>
            {editingId ? t("admin.videos.guardarCambios") : t("admin.videos.anadir")}
          </Button>
          {editingId && <Button onClick={resetForm}>{t("admin.videos.cancelar")}</Button>}
        </Box>
      </Box>
      {error && (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      )}
      {/* El filtro y la tabla, en un mismo bloque: el filtro es de esta tabla. */}
      <Box sx={ADMIN_PANEL_SX}>
      {/* El filtro, a la derecha, encima de su tabla. */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
      <TextField
        select
        label={t("admin.videos.filtrar")}
        size="small"
        value={filter}
        onChange={(changeEvent) => {
          setFilter(changeEvent.target.value);
          setPage(0);
        }}
        sx={{ width: { xs: "100%", sm: 280 } }}
      >
        <MenuItem value={ALL}>{t("admin.videos.todas")}</MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.key} value={category.key}>
            {category.name}
          </MenuItem>
        ))}
      </TextField>
      </Box>
      {videos.isPending ? (
        <CircularProgress size={24} sx={{ m: 2 }} />
      ) : filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          {t("admin.videos.ninguno")}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small" aria-label={t("admin.videos.lista")}>
            <TableHead sx={ADMIN_TABLE_HEAD_SX}>
              <TableRow>
                <TableCell>{t("admin.videos.categoria")}</TableCell>
                <TableCell>{t("admin.videos.idioma")}</TableCell>
                <TableCell>{t("admin.videos.titulo")}</TableCell>
                <TableCell>
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <YouTubeIcon fontSize="small" aria-hidden />
                    {t("admin.videos.youtube")}
                  </Box>
                </TableCell>
                <TableCell align="center">{t("admin.videos.acciones")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((video) => (
                <TableRow key={video.id} selected={video.id === editingId}>
                  <TableCell>{categoryName(video.categoryKey)}</TableCell>
                  <TableCell>{languageName(video.locale)}</TableCell>
                  <TableCell lang={video.locale}>{video.title}</TableCell>
                  <TableCell>
                    <Link href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" aria-label={t("admin.videos.verEnYoutube", { titulo: video.title })} sx={{ whiteSpace: "nowrap" }}>
                      youtu.be/{video.youtubeId}
                    </Link>
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton size="small" onClick={() => startEditing(video)} aria-label={t("admin.videos.editar", { titulo: video.title })}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => void remove(video.id)} aria-label={t("admin.videos.quitar", { titulo: video.title })}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={currentPage}
            onPageChange={(_, value) => setPage(value)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE}
            onRowsPerPageChange={(changeEvent) => {
              setRowsPerPage(Number(changeEvent.target.value));
              setPage(0);
            }}
            labelRowsPerPage={t("admin.videos.porPagina")}
            labelDisplayedRows={({ from, to, count }) => t("admin.videos.mostrando", { from, to, count })}
            // Centrada bajo la tabla (por defecto MUI la pega a la derecha).
            sx={{ "& .MuiTablePagination-toolbar": { justifyContent: "center" }, "& .MuiTablePagination-spacer": { display: "none" } }}
          />
        </TableContainer>
      )}
      </Box>
    </Box>
  );
}
