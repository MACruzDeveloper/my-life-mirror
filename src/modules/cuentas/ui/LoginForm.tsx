import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router";
import { Breadcrumbs } from "@shared/ui/components/Breadcrumbs";

type Estado = { tipo: "inicial" } | { tipo: "enviando" } | { tipo: "error"; mensaje: string };

/** Vista de RF-01 (login). El token de sesión lo pone api/login.ts como cookie httpOnly — nunca llega aquí. */
export function LoginForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });
  const navigate = useNavigate();

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado({ tipo: "enviando" });

    try {
      const respuesta = await fetch("/api/accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setEstado({ tipo: "error", mensaje: datos.error ?? t("login.errorGenerico") });
        return;
      }

      navigate("/inicio", { replace: true });
    } catch {
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ etiqueta: t("breadcrumbs.inicio"), ruta: "/" }, { etiqueta: t("breadcrumbs.iniciarSesion") }]} />
      <Box component="form" onSubmit={manejarEnvio} sx={{ maxWidth: 360, mx: "auto", mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("login.titulo")}
        </Typography>
        <Stack spacing={2}>
          {estado.tipo === "error" && <Alert severity="error">{estado.mensaje}</Alert>}
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
          <Button type="submit" variant="contained" disabled={estado.tipo === "enviando"} fullWidth>
            {estado.tipo === "enviando" ? t("login.botonEnviando") : t("login.boton")}
          </Button>
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            <Link component={RouterLink} to="/olvide-password">
              {t("login.olvideContrasena")}
            </Link>
          </Typography>
        </Stack>
      </Box>
    </>
  );
}
