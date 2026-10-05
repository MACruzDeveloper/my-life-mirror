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

interface AiOptInSectionProps {
  /** Qué elección del perfil cambia. */
  field: "aiIdeasEnabled" | "aiSuggestionsEnabled";
  endpoint: string;
  titleKey: string;
  /** Qué se envía (y qué se quita), en párrafos. */
  explanationKeys: string[];
  /** Qué nunca se envía (destacado). */
  neverKey: string;
  revocableKey: string;
  /** Al desactivarla, lo que haya que olvidar en la caché. */
  onDisabled?: () => void;
}

/**
 * Un consentimiento de IA en *Privacidad y datos*: el interruptor (desactivado
 * por defecto), qué se envía y qué no, y que se puede revocar. Solo aparece si el
 * despliegue tiene un proveedor (`aiIdeasAvailable` de la sesión). El cambio es
 * optimista. Lo usan RF-40 (ideas personalizadas) y RF-45 (sugerencias).
 */
export function AiOptInSection({ field, endpoint, titleKey, explanationKeys, neverKey, revocableKey, onDisabled }: AiOptInSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const session = useOptionalSession();
  const profile = useProfile(session?.aiIdeasAvailable === true);
  const [error, setError] = useState(false);

  if (session?.aiIdeasAvailable !== true || !profile.data) return null;
  const enabled = profile.data[field] === true;

  async function toggle(next: boolean) {
    setError(false);
    const setEnabled = (value: boolean) => queryClient.setQueryData<ProfileResponse | null>(PROFILE_KEY, (current) => (current ? { ...current, [field]: value } : current));
    setEnabled(next);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: next }) });
      if (!response.ok) throw new Error("rejected");
      if (!next) onDisabled?.();
    } catch {
      setEnabled(!next);
      setError(true);
    }
  }

  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="h6" component="h2">
        {t(titleKey)}
      </Typography>
      <FormControlLabel control={<Switch checked={enabled} onChange={(event) => void toggle(event.target.checked)} />} label={t(titleKey)} />
      {explanationKeys.map((key) => (
        <Typography key={key} variant="body2">
          {t(key)}
        </Typography>
      ))}
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t(neverKey)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t(revocableKey)}
      </Typography>
      {error && <Alert severity="error">{t("datos.iaError")}</Alert>}
    </Box>
  );
}

/** RF-40: ideas personalizadas con IA. Al desactivarla se olvidan también las personalizadas en caché (el servidor las borra). */
export function AiIdeasSection() {
  const queryClient = useQueryClient();
  return (
    <AiOptInSection
      field="aiIdeasEnabled"
      endpoint="/api/accounts/ai-ideas"
      titleKey="datos.iaTitulo"
      explanationKeys={["datos.iaQueSeEnvia"]}
      neverKey="datos.iaQueNunca"
      revocableKey="datos.iaRevocable"
      onDisabled={() => queryClient.removeQueries({ queryKey: PERSONALIZED_IDEAS_KEY })}
    />
  );
}

/** RF-45: sugerencias de opciones a partir de una experiencia, con su propio consentimiento. */
export function AiSuggestionsSection() {
  return (
    <AiOptInSection
      field="aiSuggestionsEnabled"
      endpoint="/api/accounts/ai-suggestions"
      titleKey="datos.sugerenciasTitulo"
      explanationKeys={["datos.sugerenciasQueSeEnvia", "datos.sugerenciasQueSeQuita"]}
      neverKey="datos.sugerenciasQueNunca"
      revocableKey="datos.sugerenciasRevocable"
    />
  );
}
