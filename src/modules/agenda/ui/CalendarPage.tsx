import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { useTranslation } from "react-i18next";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { useCategories } from "@modules/categories/ui/queries";
import { MAX_EVENT_CATEGORIES, MAX_EVENT_TITLE_LENGTH } from "@modules/agenda/domain/UserEvent";
import { useIdeaReactions } from "@modules/recommendations/ui/ideaReactions";
import { dayFromToday } from "@modules/recommendations/ui/planDates";
import { type AgendaItem, type YearMonth, agendaItems, localDate, monthOf, monthWeeks, shiftMonth } from "./calendarMonth";
import { useEventActions, useEvents } from "./queries";

/** Un lunes cualquiera, para sacar los nombres de los días en el idioma de la interfaz. */
const A_MONDAY = new Date(2024, 0, 1);

/**
 * El día de hoy, en el naranja de la app (el de la banda "casi bajo" de las
 * puntuaciones, `scoreBand.ts`). Aquí no significa una nota: lo pidió el autor
 * para que hoy se distinga de los días con algo anotado, que van en azul marino.
 */
const TODAY_COLORS = { bg: "#FFF1E0", fg: "#A85300", border: "#FFD2A1" };

const ARROW_SX = { bgcolor: "primary.main", color: "primary.contrastText", "&:hover": { bgcolor: "primary.dark" } };

/**
 * RF-48: el calendario. Un mes a la vista, con los días que tienen algo
 * marcados (eventos propios e ideas guardadas con fecha, RF-47); al elegir un
 * día se ve lo que hay y se puede añadir un evento. Mobile-first: el mes
 * arriba y el día debajo; desde `md`, en dos columnas. Un evento no cambia
 * ninguna puntuación (RN-04).
 */
export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const today = dayFromToday(0);
  const [selectedDay, setSelectedDay] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>(monthOf(today));
  const events = useEvents();
  const reactions = useIdeaReactions();
  const categories = useCategories();
  const { categoryLabel, isPending: labelsPending } = useCategoryLabel();
  const { addEvent, deleteEvent } = useEventActions();
  const [failed, setFailed] = useState(false);
  const dayTitleId = useId();

  if (events.isPending || labelsPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const items = agendaItems(Array.isArray(events.data) ? events.data : [], Array.isArray(reactions.data) ? reactions.data : []);
  const countByDay = items.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.day]: (counts[item.day] ?? 0) + 1 }), {});
  const allCategories = Array.isArray(categories.data) ? categories.data : [];
  const categoryName = (categoryId: string | undefined) => {
    const category = allCategories.find((candidate) => candidate.id === categoryId);
    return category ? categoryLabel(category.catalogId).name || category.name : "";
  };
  const fullDate = (day: string) => localDate(day).toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" });
  const monthTitle = new Date(visibleMonth.year, visibleMonth.month - 1, 1).toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
  const weekdays = Array.from({ length: 7 }, (_, index) => new Date(A_MONDAY.getFullYear(), 0, A_MONDAY.getDate() + index).toLocaleDateString(i18n.language, { weekday: "short" }));

  function select(day: string) {
    setSelectedDay(day);
    setVisibleMonth(monthOf(day));
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t("calendario.titulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("calendario.intro")}
      </Typography>
      {(events.isError || failed) && (
        <Typography variant="body2" color="error" role="alert" sx={{ mb: 2 }}>
          {t("calendario.error")}
        </Typography>
      )}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "flex-start" }, gap: 3 }}>
        <Box sx={{ flex: { md: "1 1 0" }, minWidth: 0, p: { xs: 1.5, sm: 2.5 }, borderRadius: 0, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <IconButton size="small" aria-label={t("calendario.mesAnterior")} onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))} sx={ARROW_SX}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" component="h2" sx={{ flex: 1, textAlign: "center", "&::first-letter": { textTransform: "uppercase" } }}>
              {monthTitle}
            </Typography>
            <IconButton size="small" aria-label={t("calendario.mesSiguiente")} onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))} sx={ARROW_SX}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 0.5 }}>
            {weekdays.map((weekday) => (
              <Typography key={weekday} variant="caption" color="text.secondary" aria-hidden sx={{ textAlign: "center", textTransform: "capitalize" }}>
                {weekday}
              </Typography>
            ))}
            {monthWeeks(visibleMonth.year, visibleMonth.month)
              .flat()
              .map((day, index) => {
                if (!day) return <Box key={`empty-${index}`} />;
                const count = countByDay[day] ?? 0;
                const selected = day === selectedDay;
                return (
                  <Box
                    key={day}
                    component="button"
                    type="button"
                    aria-pressed={selected}
                    aria-current={day === today ? "date" : undefined}
                    aria-label={count > 0 ? `${fullDate(day)}: ${t("calendario.anotaciones", { count })}` : fullDate(day)}
                    onClick={() => select(day)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      // El punto va colocado aparte: así el número queda centrado en su fondo.
                      position: "relative",
                      minHeight: 44,
                      p: 0,
                      font: "inherit",
                      cursor: "pointer",
                      borderRadius: 2,
                      border: 1,
                      // Tres señales que no se pisan: hoy, en naranja; un día con algo anotado, en azul marino;
                      // y el día elegido, con un contorno (sin relleno, para no tapar a las otras dos).
                      borderColor: "transparent",
                      fontWeight: day === today ? 700 : 400,
                      bgcolor: day === today ? TODAY_COLORS.bg : count > 0 ? "primary.main" : "transparent",
                      color: day === today ? TODAY_COLORS.fg : count > 0 ? "primary.contrastText" : "text.primary",
                      // Hoy ya se distingue por su naranja: sin contorno aunque sea el día elegido.
                      outline: selected && day !== today ? "2px solid" : "none",
                      outlineColor: "primary.main",
                      outlineOffset: 2,
                      "&:hover": { bgcolor: day === today ? TODAY_COLORS.border : count > 0 ? "primary.dark" : "action.hover" },
                      "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                    }}
                  >
                    <span>{Number(day.slice(8))}</span>
                    {/* Hoy ya va en naranja: si además tiene algo anotado, se marca con un punto azul. */}
                    {day === today && count > 0 && <Box component="span" aria-hidden sx={{ position: "absolute", bottom: 5, left: "calc(50% - 3px)", width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main" }} />}
                  </Box>
                );
              })}
          </Box>
        </Box>
        <Box component="section" aria-labelledby={dayTitleId} sx={{ flex: { md: "1 1 0" }, minWidth: 0, p: 2.5, borderRadius: 0, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography id={dayTitleId} variant="subtitle1" component="h2" sx={{ fontWeight: 600, "&::first-letter": { textTransform: "uppercase" } }}>
            {fullDate(selectedDay)}
          </Typography>
          <DayItems items={items.filter((item) => item.day === selectedDay)} categoryName={categoryName} onDelete={(id) => void deleteEvent(id).then((deleted) => setFailed(!deleted))} />
          <AddEventForm
            day={selectedDay}
            onDayChange={select}
            categories={allCategories.filter((category) => category.status === "active").map((category) => ({ id: category.id, name: categoryName(category.id) }))}
            onAdd={async (input) => {
              const added = await addEvent(input);
              setFailed(!added);
              return added;
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/** Los nombres de las categorías de un evento que siguen existiendo. */
function eventCategories(categoryIds: readonly string[] | undefined, categoryName: (categoryId: string | undefined) => string): string[] {
  return (categoryIds ?? []).map(categoryName).filter((name) => name !== "");
}

function DayItems({ items, categoryName, onDelete }: { items: AgendaItem[]; categoryName: (categoryId: string | undefined) => string; onDelete: (id: string) => void }) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t("calendario.diaVacio")}
      </Typography>
    );
  }
  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
      {items.map((item) =>
        item.kind === "event" ? (
          <Box component="li" key={item.event.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <EventOutlinedIcon fontSize="small" color="primary" sx={{ mt: 0.25 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" sx={{ overflowWrap: "anywhere" }}>
                {item.event.title}
              </Typography>
              {eventCategories(item.event.categoryIds, categoryName).length > 0 && (
                <Typography variant="caption" color="text.secondary" component="p">
                  {eventCategories(item.event.categoryIds, categoryName).join(" · ")}
                </Typography>
              )}
            </Box>
            <IconButton size="small" aria-label={t("calendario.borrar", { titulo: item.event.title })} onClick={() => onDelete(item.event.id)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box component="li" key={`${item.idea.categoryId}-${item.idea.templateKey}`} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <LightbulbOutlinedIcon fontSize="small" color="primary" sx={{ mt: 0.25 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" component="p">
                {t("calendario.ideaGuardada")}
                {categoryName(item.idea.categoryId) ? ` · ${categoryName(item.idea.categoryId)}` : ""}
              </Typography>
              <Typography variant="body1">{t(`recomendaciones.plantillas.${item.idea.templateKey}`, { categoria: categoryName(item.idea.categoryId) })}</Typography>
            </Box>
          </Box>
        ),
      )}
    </Box>
  );
}

interface AddEventFormProps {
  day: string;
  onDayChange: (day: string) => void;
  categories: { id: string; name: string }[];
  onAdd: (input: { title: string; day: string; categoryIds: string[] }) => Promise<boolean>;
}

function AddEventForm({ day, onDayChange, categories, onAdd }: AddEventFormProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [title, setTitle] = useState("");
  const categoriesId = useId();
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  function toggleCategory(categoryId: string) {
    setCategoryIds((current) => (current.includes(categoryId) ? current.filter((id) => id !== categoryId) : current.length < MAX_EVENT_CATEGORIES ? [...current, categoryId] : current));
  }
  const [sending, setSending] = useState(false);

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (title.trim().length === 0) return;
    setSending(true);
    const added = await onAdd({ title: title.trim(), day, categoryIds });
    setSending(false);
    if (added) {
      setTitle("");
      setCategoryIds([]);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} aria-labelledby={titleId} sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider", display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography id={titleId} variant="subtitle2" component="h3">
        {t("calendario.anadirTitulo")}
      </Typography>
      <TextField
        label={t("calendario.queTienes")}
        value={title}
        onChange={(changeEvent) => setTitle(changeEvent.target.value)}
        size="small"
        required
        fullWidth
        helperText={t("calendario.privado")}
        slotProps={{ htmlInput: { maxLength: MAX_EVENT_TITLE_LENGTH } }}
      />
      <TextField
        label={t("calendario.dia")}
        type="date"
        value={day}
        onChange={(changeEvent) => changeEvent.target.value && onDayChange(changeEvent.target.value)}
        size="small"
        required
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ maxWidth: { sm: 220 } }}
      />
      {categories.length > 0 && (
        <Box role="group" aria-labelledby={categoriesId}>
          <Typography id={categoriesId} variant="body2" sx={{ mb: 0.75 }}>
            {t("calendario.categorias")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {categories.map((category) => {
              const selected = categoryIds.includes(category.id);
              return (
                <Chip
                  key={category.id}
                  label={category.name}
                  component="button"
                  type="button"
                  aria-pressed={selected}
                  disabled={!selected && categoryIds.length >= MAX_EVENT_CATEGORIES}
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  onClick={() => toggleCategory(category.id)}
                />
              );
            })}
          </Box>
          {/* Qué hará la app con esto: invitar a mirar la nota, nunca ponerla. */}
          <Typography variant="caption" color="text.secondary" component="p" aria-live="polite" sx={{ mt: 0.75, minHeight: 20 }}>
            {categoryIds.length > 0 ? t("calendario.avisoRevision") : t("calendario.categoriasAyuda")}
          </Typography>
        </Box>
      )}
      <Button type="submit" variant="contained" disabled={sending} sx={{ alignSelf: { sm: "flex-start" } }}>
        {t("calendario.anadir")}
      </Button>
    </Box>
  );
}
