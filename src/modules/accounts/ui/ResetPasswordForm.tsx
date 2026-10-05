import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@shared/ui/components/Breadcrumbs";
import { extractTokenFromHash } from "./extractTokenFromHash";
import { PublicFormBox } from "@shared/ui/components/PublicFormBox";

type FormState = { kind: "inicial" } | { kind: "enviando" } | { kind: "exito" } | { kind: "error"; message: string };

/** Vista de RF-38. El token llega en el hash de la URL (enlace de Supabase) — ver extraerTokenDeHash. */
export function ResetPasswordForm() {
  const { t } = useTranslation();
  const [token] = useState(() => extractTokenFromHash(window.location.hash));
  const [password, setPassword] = useState("");
  const [formState, setFormState] = useState<FormState>({ kind: "inicial" });

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!token) return;
    setFormState({ kind: "enviando" });

    try {
      const response = await fetch("/api/accounts/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormState({ kind: "error", message: data.error ?? t("restablecerPassword.errorGenerico") });
        return;
      }

      setFormState({ kind: "exito" });
    } catch {
      setFormState({ kind: "error", message: t("comun.errorServidor") });
    }
  }

  const breadcrumbs = [
    { label: t("breadcrumbs.inicio"), path: "/" },
    { label: t("breadcrumbs.restablecerContrasena") },
  ];

  if (!token) {
    return (
      <>
        <Breadcrumbs items={breadcrumbs} />
        <PublicFormBox>
          <Alert severity="error">
            {t("restablecerPassword.enlaceInvalido")}
          </Alert>
        </PublicFormBox>
      </>
    );
  }

  if (formState.kind === "exito") {
    return (
      <>
        <Breadcrumbs items={breadcrumbs} />
        <PublicFormBox>
          <Alert severity="success">
            {t("restablecerPassword.exito")}
          </Alert>
        </PublicFormBox>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <PublicFormBox component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("restablecerPassword.titulo")}
        </Typography>
        <Stack spacing={2}>
          {formState.kind === "error" && <Alert severity="error">{formState.message}</Alert>}
          <TextField
            label={t("restablecerPassword.nuevaContrasena")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={t("comun.contrasenaAyuda")}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={formState.kind === "enviando"} fullWidth>
            {formState.kind === "enviando" ? t("restablecerPassword.botonEnviando") : t("restablecerPassword.boton")}
          </Button>
        </Stack>
      </PublicFormBox>
    </>
  );
}
