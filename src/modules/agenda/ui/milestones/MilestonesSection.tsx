import { useId, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { useTranslation } from "react-i18next";
import { PAGE_MAX_WIDTH } from "@shared/ui/components/Breadcrumbs";
import { MAX_MILESTONE_TITLE_LENGTH, type MilestoneCategory } from "@modules/agenda/domain/Milestone";
import { type MilestoneDto, useMilestoneActions, useMilestones } from "../milestoneQueries";
import { monthNames, tripDate } from "../trips/countryNames";

const FIRST_YEAR = 1900;

/**
 * RF-49: los hitos de una página de categoría ("Retos superados" en Aventura;
 * "Carreras, competiciones y marcas" en Deporte). Un hito es un título corto,
 * un año y, si se recuerda, el mes: algo conseguido, así que no del futuro.
 * El título es privado (no va a la IA ni se comparte) y nada de esto cambia
 * una nota (RN-04).
 */
export function MilestonesSection({ categoryKey }: { categoryKey: MilestoneCategory }) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const milestones = useMilestones(categoryKey);
  const { addMilestone, deleteMilestone } = useMilestoneActions(categoryKey);
  const months = useMemo(() => monthNames(i18n.language), [i18n.language]);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, index) => currentYear - index);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const list: MilestoneDto[] = Array.isArray(milestones.data) ? milestones.data : [];

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!title.trim() || !year) return;
    setSending(true);
    const added = await addMilestone({ title: title.trim(), year: Number(year), ...(month ? { month: Number(month) } : {}) });
    setSending(false);
    setFailed(!added);
    if (added) {
      setTitle("");
      setYear("");
      setMonth("");
    }
  }

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ maxWidth: PAGE_MAX_WIDTH, mx: "auto", px: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <EmojiEventsOutlinedIcon color="primary" />
        <Typography id={titleId} variant="h6" component="h2">
          {t(`hitos.titulo.${categoryKey}`)}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {t(`hitos.intro.${categoryKey}`)}
      </Typography>
      {/* El formulario y la lista, en blanco como las tarjetas de arriba de la página. */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, p: 2.5, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Box component="form" onSubmit={handleSubmit} aria-label={t("hitos.anadirTitulo")} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="subtitle2" component="h3">
            {t("hitos.anadirTitulo")}
          </Typography>
          <TextField
            label={t("hitos.queConseguiste")}
            placeholder={t(`hitos.ejemplo.${categoryKey}`)}
            value={title}
            onChange={(changeEvent) => setTitle(changeEvent.target.value)}
            size="small"
            required
            slotProps={{ htmlInput: { maxLength: MAX_MILESTONE_TITLE_LENGTH } }}
          />
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
            <TextField select label={t("viajes.anio")} value={year} onChange={(changeEvent) => setYear(changeEvent.target.value)} size="small" required fullWidth>
              {years.map((option) => (
                <MenuItem key={option} value={String(option)}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label={t("viajes.mes")} value={month} onChange={(changeEvent) => setMonth(changeEvent.target.value)} size="small" fullWidth>
              <MenuItem value="">{t("viajes.sinMes")}</MenuItem>
              {months.map((name, index) => (
                <MenuItem key={name} value={String(index + 1)}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Button type="submit" variant="contained" color="secondary" disabled={sending} sx={{ alignSelf: { sm: "flex-start" } }}>
            {t("hitos.anadir")}
          </Button>
          {failed && (
            <Typography variant="body2" color="error" role="alert">
              {t("viajes.error")}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="subtitle2" component="h3">
            {t("hitos.tusHitos", { count: list.length })}
          </Typography>
          {milestones.isPending ? (
            <Box aria-hidden sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} variant="rectangular" height={40} />
              ))}
            </Box>
          ) : list.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("hitos.ninguno")}
            </Typography>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              {list.map((milestone) => {
                const date = tripDate(milestone.year, milestone.month, i18n.language);
                return (
                  <Box component="li" key={milestone.id} sx={{ display: "flex", alignItems: "center", gap: 1, borderLeft: 3, borderColor: "secondary.main", pl: 1.5 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                        {milestone.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="p">
                        {date}
                      </Typography>
                    </Box>
                    <IconButton size="small" aria-label={t("hitos.borrar", { titulo: milestone.title, fecha: date })} onClick={() => void deleteMilestone(milestone.id).then((deleted) => setFailed(!deleted))}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" component="p">
            {t("hitos.noCambianNota")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
