import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { PublicFormBox } from "@shared/ui/components/PublicFormBox";
import { Link as RouterLink, useNavigate } from "react-router";
import { Breadcrumbs } from "@shared/ui/components/Breadcrumbs";

type FormState = { kind: "inicial" } | { kind: "enviando" } | { kind: "error"; message: string };

/** Vista de RF-01 (login). El token de sesión lo pone api/login.ts como cookie httpOnly — nunca llega aquí. */
export function LoginForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formState, setFormState] = useState<FormState>({ kind: "inicial" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setFormState({ kind: "enviando" });

    try {
      const response = await fetch("/api/accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        // SEC-01: un único mensaje, sin pistas sobre qué ha fallado; salvo el aviso de esperar (SEC-02).
        setFormState({ kind: "error", message: data.code === "RATE_LIMITED" ? t("comun.demasiadosIntentos") : response.status === 401 ? t("login.errorCredenciales") : t("login.errorGenerico") });
        return;
      }

      // Otro usuario podría haber usado este navegador: nada de su caché.
      queryClient.clear();
      navigate("/inicio", { replace: true });
    } catch {
      setFormState({ kind: "error", message: t("comun.errorServidor") });
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: t("breadcrumbs.inicio"), path: "/" }, { label: t("breadcrumbs.iniciarSesion") }]} />
      <PublicFormBox component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("login.titulo")}
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
          <TextField
            label={t("comun.contrasena")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={formState.kind === "enviando"} fullWidth>
            {formState.kind === "enviando" ? t("login.botonEnviando") : t("login.boton")}
          </Button>
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            <Link component={RouterLink} to="/olvide-password">
              {t("login.olvideContrasena")}
            </Link>
          </Typography>
        </Stack>
      </PublicFormBox>
    </>
  );
}
