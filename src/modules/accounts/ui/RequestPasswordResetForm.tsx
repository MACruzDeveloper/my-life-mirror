import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@shared/ui/components/Breadcrumbs";
import { PublicFormBox } from "@shared/ui/components/PublicFormBox";

type FormState = { kind: "inicial" } | { kind: "enviando" } | { kind: "enviado" } | { kind: "error"; message: string };

/** Vista de RF-38. La confirmación es la misma exista o no el email — nunca lo revela. */
export function RequestPasswordResetForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>({ kind: "inicial" });

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setFormState({ kind: "enviando" });

    try {
      const response = await fetch("/api/accounts/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormState({ kind: "error", message: data.error ?? t("olvidePassword.errorGenerico") });
        return;
      }

      setFormState({ kind: "enviado" });
    } catch {
      setFormState({ kind: "error", message: t("comun.errorServidor") });
    }
  }

  const breadcrumbs = [
    { label: t("breadcrumbs.inicio"), path: "/" },
    { label: t("breadcrumbs.iniciarSesion"), path: "/login" },
    { label: t("breadcrumbs.recuperarContrasena") },
  ];

  if (formState.kind === "enviado") {
    return (
      <>
        <Breadcrumbs items={breadcrumbs} />
        <PublicFormBox>
          <Alert severity="success">
            {t("olvidePassword.confirmacion")}
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
          {t("olvidePassword.titulo")}
        </Typography>
        <Stack spacing={2}>
          {formState.kind === "error" && <Alert severity="error">{formState.message}</Alert>}
          <TextField
            label={t("comun.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={formState.kind === "enviando"} fullWidth>
            {formState.kind === "enviando" ? t("olvidePassword.botonEnviando") : t("olvidePassword.boton")}
          </Button>
        </Stack>
      </PublicFormBox>
    </>
  );
}
