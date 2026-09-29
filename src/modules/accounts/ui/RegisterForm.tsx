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

type FormState =
  | { kind: "inicial" }
  | { kind: "enviando" }
  | { kind: "exito"; email: string }
  | { kind: "error"; message: string };

/**
 * Vista de RF-01. Llama a /api/register — nunca importa infraestructura
 * directamente (AGENTS.md). Tras registrarse la sesión ya está iniciada. Incluye el nombre desde este primer paso
 * (RF-03): así el Header nunca tiene que mostrar el email en bruto.
 */
export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formState, setFormState] = useState<FormState>({ kind: "inicial" });

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setFormState({ kind: "enviando" });

    try {
      const response = await fetch("/api/accounts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormState({ kind: "error", message: data.error ?? t("registro.errorGenerico") });
        return;
      }

      // El servidor deja la sesión iniciada al registrar: directo a la bienvenida (RF-39).
      if (data.sesionIniciada) {
        queryClient.clear();
        navigate("/inicio", { replace: true });
        return;
      }
      setFormState({ kind: "exito", email: data.email });
    } catch {
      setFormState({ kind: "error", message: t("comun.errorServidor") });
    }
  }

  const breadcrumbs = [
    { label: t("breadcrumbs.inicio"), path: "/" },
    { label: t("breadcrumbs.crearCuenta") },
  ];

  if (formState.kind === "exito") {
    return (
      <>
        <Breadcrumbs items={breadcrumbs} />
        <PublicFormBox>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("registro.exito", { email: formState.email })}
          </Alert>
          <Typography variant="body2">
            <Link component={RouterLink} to="/login">
              {t("registro.irALogin")}
            </Link>
          </Typography>
        </PublicFormBox>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <PublicFormBox component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("registro.titulo")}
        </Typography>
        <Stack spacing={2}>
          {formState.kind === "error" && <Alert severity="error">{formState.message}</Alert>}
          <TextField
            label={t("perfil.nombre")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
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
            helperText={t("comun.contrasenaAyuda")}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={formState.kind === "enviando"} fullWidth>
            {formState.kind === "enviando" ? t("registro.botonEnviando") : t("registro.boton")}
          </Button>
        </Stack>
      </PublicFormBox>
    </>
  );
}
