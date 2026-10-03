import { useId } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { PENDING_COLORS } from "./pendingColors";

export type ProgressStatus = { kind: "unanswered" } | { kind: "unsaved" } | { kind: "savedToday" } | { kind: "saved"; recordedAt: string };

export interface ProgressItem {
  categoryId: string;
  name: string;
  status: ProgressStatus;
}

/** Color del punto de cada estado: lila para lo pendiente (como "Sin responder", RN-04), ámbar suave sin guardar, verde guardado. */
const STATUS_COLORS: Record<ProgressStatus["kind"], string> = { unanswered: PENDING_COLORS.border, unsaved: "#E8B54D", savedToday: "#3E9B7A", saved: "#9CC9B8" };

/**
 * UX-05: progreso de la entrevista en la columna derecha (escritorio): cuántas
 * categorías activas tienen respuesta y el estado de cada una. Tocar una lleva
 * a su pregunta. La página lo deja fijo al desplazarse y lo oculta en móvil (la
 * página enseña los accesos directos de arriba).
 */
export function InterviewProgress({ items, onSelect }: { items: ProgressItem[]; onSelect: (categoryId: string) => void }) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const answered = items.filter((item) => item.status.kind !== "unanswered").length;

  const statusText = (status: ProgressStatus) => {
    if (status.kind === "unanswered") return t("entrevista.sinResponder");
    if (status.kind === "unsaved") return t("entrevista.estadoSinGuardar");
    if (status.kind === "savedToday") return t("entrevista.estadoGuardadaHoy");
    return t("entrevista.estadoGuardada", { fecha: new Date(status.recordedAt).toLocaleDateString(i18n.language, { day: "numeric", month: "long" }) });
  };

  return (
    <Box component="aside" aria-labelledby={titleId} sx={{ bgcolor: "#FFFFFF", border: "1px solid #E4EAE8", borderRadius: 3, p: 2 }}>
      <Typography id={titleId} variant="subtitle1" component="h2">
        {t("entrevista.progresoTitulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t("entrevista.progresoResumen", { respondidas: answered, total: items.length })}
      </Typography>
      <LinearProgress variant="determinate" value={items.length === 0 ? 0 : (answered / items.length) * 100} aria-hidden sx={{ height: 6, borderRadius: 3, mb: 1.5 }} />
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {items.map((item) => (
          <Box component="li" key={item.categoryId}>
            <ButtonBase
              onClick={() => onSelect(item.categoryId)}
              sx={{ width: "100%", justifyContent: "flex-start", textAlign: "left", gap: 1, px: 1, py: 0.75, borderRadius: 2, "&:hover, &:focus-visible": { bgcolor: "#F5F7F6" } }}
            >
              <Box component="span" aria-hidden sx={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, bgcolor: STATUS_COLORS[item.status.kind] }} />
              <Box component="span" sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Typography component="span" variant="body2">
                  {item.name}
                </Typography>
                <Typography component="span" variant="caption" color="text.secondary">
                  {statusText(item.status)}
                </Typography>
              </Box>
            </ButtonBase>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
