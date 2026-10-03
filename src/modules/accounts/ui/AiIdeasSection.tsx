import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { PERSONALIZED_IDEAS_KEY } from "@modules/recommendations/ui/queries";
import { useOptionalSession } from "@shared/ui/context/SessionContext";
import { PROFILE_KEY, useProfile, type ProfileResponse } from "./queries";

/**
 * RF-40: el usuario activa o desactiva las ideas personalizadas con IA, sabiendo
 * qué se envía y qué no. Solo aparece si el despliegue tiene un proveedor
 * (`aiIdeasAvailable` de la sesión). El cambio es optimista; al desactivarla se
 * olvidan también las ideas personalizadas en caché (el servidor las borra).
 */
export function AiIdeasSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const session = useOptionalSession();
  const profile = useProfile(session?.aiIdeasAvailable === true);
  const [error, setError] = useState(false);

  if (session?.aiIdeasAvailable !== true || !profile.data) return null;
  const enabled = profile.data.aiIdeasEnabled === true;

  async function toggle(next: boolean) {
    setError(false);
    const setEnabled = (value: boolean) => queryClient.setQueryData<ProfileResponse | null>(PROFILE_KEY, (current) => (current ? { ...current, aiIdeasEnabled: value } : current));
    setEnabled(next);
    try {
      const response = await fetch("/api/accounts/ai-ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: next }) });
      if (!response.ok) throw new Error("rejected");
      if (!next) queryClient.removeQueries({ queryKey: PERSONALIZED_IDEAS_KEY });
    } catch {
      setEnabled(!next);
      setError(true);
    }
  }

  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="h6" component="h2">
        {t("datos.iaTitulo")}
      </Typography>
      <FormControlLabel control={<Switch checked={enabled} onChange={(event) => void toggle(event.target.checked)} />} label={t("datos.iaActivar")} />
      <Typography variant="body2">{t("datos.iaQueSeEnvia")}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t("datos.iaQueNunca")}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t("datos.iaRevocable")}
      </Typography>
      {error && <Alert severity="error">{t("datos.iaError")}</Alert>}
    </Box>
  );
}
