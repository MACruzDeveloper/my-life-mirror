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

type Estado =
  | { tipo: "inicial" }
  | { tipo: "enviando" }
  | { tipo: "exito"; email: string }
  | { tipo: "error"; mensaje: string };

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
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado({ tipo: "enviando" });

    try {
      const respuesta = await fetch("/api/accounts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setEstado({ tipo: "error", mensaje: datos.error ?? t("registro.errorGenerico") });
        return;
      }

      // El servidor deja la sesión iniciada al registrar: directo a la bienvenida (RF-39).
      if (datos.sesionIniciada) {
        queryClient.clear();
        navigate("/inicio", { replace: true });
        return;
      }
      setEstado({ tipo: "exito", email: datos.email });
    } catch {
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
    }
  }

  const migas = [
    { etiqueta: t("breadcrumbs.inicio"), ruta: "/" },
    { etiqueta: t("breadcrumbs.crearCuenta") },
  ];

  if (estado.tipo === "exito") {
    return (
      <>
        <Breadcrumbs items={migas} />
        <PublicFormBox>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("registro.exito", { email: estado.email })}
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
      <Breadcrumbs items={migas} />
      <PublicFormBox component="form" onSubmit={manejarEnvio}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("registro.titulo")}
        </Typography>
        <Stack spacing={2}>
          {estado.tipo === "error" && <Alert severity="error">{estado.mensaje}</Alert>}
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
          <Button type="submit" variant="contained" disabled={estado.tipo === "enviando"} fullWidth>
            {estado.tipo === "enviando" ? t("registro.botonEnviando") : t("registro.boton")}
          </Button>
        </Stack>
      </PublicFormBox>
    </>
  );
}
