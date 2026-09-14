import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@shared/ui/Breadcrumbs";

type Estado = { tipo: "inicial" } | { tipo: "enviando" } | { tipo: "enviado" } | { tipo: "error"; mensaje: string };

/** Vista de RF-38. La confirmación es la misma exista o no el email — nunca lo revela. */
export function SolicitarRecuperacionForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado({ tipo: "enviando" });

    try {
      const respuesta = await fetch("/api/solicitar-recuperacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setEstado({ tipo: "error", mensaje: datos.error ?? t("olvidePassword.errorGenerico") });
        return;
      }

      setEstado({ tipo: "enviado" });
    } catch {
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
    }
  }

  const migas = [
    { etiqueta: t("breadcrumbs.inicio"), ruta: "/" },
    { etiqueta: t("breadcrumbs.iniciarSesion"), ruta: "/login" },
    { etiqueta: t("breadcrumbs.recuperarContrasena") },
  ];

  if (estado.tipo === "enviado") {
    return (
      <>
        <Breadcrumbs items={migas} />
        <Alert severity="success" sx={{ maxWidth: 360, mx: "auto", mt: 4 }}>
          {t("olvidePassword.confirmacion")}
        </Alert>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={migas} />
      <Box component="form" onSubmit={manejarEnvio} sx={{ maxWidth: 360, mx: "auto", mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("olvidePassword.titulo")}
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
          <Button type="submit" variant="contained" disabled={estado.tipo === "enviando"} fullWidth>
            {estado.tipo === "enviando" ? t("olvidePassword.botonEnviando") : t("olvidePassword.boton")}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
