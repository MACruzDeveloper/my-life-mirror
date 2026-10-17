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
import { type PasswordRule, checkPassword } from "@modules/accounts/domain/passwordPolicy";
import { authErrorMessage } from "./authErrors";
import { NewPasswordField } from "./NewPasswordField";

type FormState =
  | { kind: "inicial" }
  | { kind: "enviando" }
  | { kind: "exito"; email: string }
  | { kind: "error"; message: string };

/**
 * Vista de RF-01. Llama a /api/register — nunca importa infraestructura
 * directamente (AGENTS.md). Tras registrarse la sesión ya está iniciada. Incluye el nombre desde este primer paso
 * (RF-03): así el Header nunca tiene que mostrar el email en bruto.
 *
 * SEC-01: la contraseña se comprueba aquí con la misma regla que en el
 * servidor, para explicar qué falta antes de enviar; el servidor la vuelve a
 * comprobar (lo del navegador es comodidad, no seguridad).
 */
export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formState, setFormState] = useState<FormState>({ kind: "inicial" });
  const [submitted, setSubmitted] = useState(false);
  const [serverRules, setServerRules] = useState<PasswordRule[]>([]);
  const passwordContext = { email, name };

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setSubmitted(true);
    setServerRules([]);
    if (checkPassword(password, passwordContext).length > 0) {
      setFormState({ kind: "error", message: t("contrasena.noCumple") });
      return;
    }
    setFormState({ kind: "enviando" });

    try {
      const response = await fetch("/api/accounts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.code === "WEAK_PASSWORD") setServerRules(data.rules ?? []);
        setFormState({ kind: "error", message: authErrorMessage(t, data, t("registro.errorGenerico")) });
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
        {/* Solo lo imprescindible para empezar; lo demás, después y si se quiere. */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("registro.despues")}
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
          <NewPasswordField label={t("comun.contrasena")} value={password} onChange={setPassword} context={passwordContext} showErrors={submitted} serverRules={serverRules} />
          <Button type="submit" variant="contained" disabled={formState.kind === "enviando"} fullWidth>
            {formState.kind === "enviando" ? t("registro.botonEnviando") : t("registro.boton")}
          </Button>
        </Stack>
      </PublicFormBox>
    </>
  );
}
