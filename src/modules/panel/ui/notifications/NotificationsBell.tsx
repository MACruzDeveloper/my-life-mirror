import { useId, useState } from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { useEvents } from "@modules/agenda/ui/queries";
import { readDismissedFollowUps } from "@modules/agenda/ui/followUps";
import { useLatestScores } from "@modules/assessments/ui/queries";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { useCategories } from "@modules/categories/ui/queries";
import { useIdeaReactions } from "@modules/recommendations/ui/ideaReactions";
import { formatDay } from "@modules/recommendations/ui/planDates";
import { type AppNotification, buildNotifications } from "./notifications";

// Preferencia de este navegador: los avisos que ya se vieron (el contador solo cuenta los nuevos).
const SEEN_KEY = "mlm.notificationsSeen";

function readSeen(): string[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveSeen(ids: string[]) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-100)));
  } catch {
    // No es crítico: el contador volverá a salir en la próxima visita.
  }
}

/**
 * La campana de la cabecera: reúne los avisos que la app ya daba en Inicio
 * (revisar la nota tras un evento, ideas con fecha que ha llegado, categorías
 * sin revisar desde hace un mes). El número cuenta los que aún no se han
 * visto; al abrirla, dejan de ser nuevos. Todo dentro de la app: sin correo
 * ni notificaciones del sistema. Los datos salen de la caché de cada pantalla.
 */
export function NotificationsBell() {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [seen, setSeen] = useState(readSeen);
  const events = useEvents().data;
  const reactions = useIdeaReactions().data;
  const latest = useLatestScores().data;
  const categories = useCategories().data;
  const { categoryLabel } = useCategoryLabel();

  const categoryNames = Object.fromEntries((Array.isArray(categories) ? categories : []).map((category) => [category.id, categoryLabel(category.catalogId).name || category.name]));
  const items = buildNotifications({
    now: new Date(),
    categoryNames,
    events: Array.isArray(events) ? events : [],
    dismissedFollowUps: readDismissedFollowUps(),
    reactions: Array.isArray(reactions) ? reactions : [],
    latestScores: (Array.isArray(latest) ? latest : []).map((score) => ({ ...score, categoryName: categoryNames[score.categoryId] ?? score.categoryName })),
  });
  const unseen = items.filter((item) => !seen.includes(item.id)).length;

  function open(target: HTMLElement) {
    setAnchor(target);
    const next = [...new Set([...seen, ...items.map((item) => item.id)])];
    setSeen(next);
    saveSeen(next);
  }

  function text(item: AppNotification): string {
    if (item.kind === "event") return t("avisos.evento", { titulo: item.title, categorias: new Intl.ListFormat(i18n.language, { type: "conjunction" }).format(item.categories) });
    if (item.kind === "idea") return t("avisos.idea", { categoria: item.category, fecha: formatDay(item.day, i18n.language) });
    return t("avisos.revisar", { categoria: item.category, count: item.weeks });
  }

  return (
    <>
      <IconButton
        aria-label={unseen > 0 ? t("avisos.botonNuevos", { count: unseen }) : t("avisos.titulo")}
        aria-haspopup="dialog"
        onClick={(clickEvent) => open(clickEvent.currentTarget)}
        sx={{ color: "inherit", borderRadius: 0, alignSelf: "stretch", px: 2 }}
      >
        <Badge badgeContent={unseen} color="error" max={9}>
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { role: "dialog", "aria-labelledby": titleId, sx: { width: { xs: "calc(100vw - 32px)", sm: 360 }, maxHeight: 420 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography id={titleId} variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
            {t("avisos.titulo")}
          </Typography>
          {items.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("avisos.ninguno")}
            </Typography>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column" }}>
              {items.map((item) => (
                <Box component="li" key={item.id} sx={{ py: 1.25, borderTop: 1, borderColor: "divider", "&:first-of-type": { borderTop: 0 } }}>
                  <Link component={RouterLink} to={item.link} onClick={() => setAnchor(null)} underline="hover" color="text.primary" variant="body2">
                    {text(item)}
                  </Link>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}
