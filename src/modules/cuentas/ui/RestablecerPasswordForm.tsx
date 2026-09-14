import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@shared/ui/Breadcrumbs";
import { extraerTokenDeHash } from "./extraerTokenDeHash";

type Estado = { tipo: "inicial" } | { tipo: "enviando" } | { tipo: "exito" } | { tipo: "error"; mensaje: string };

/** Vista de RF-38. El token llega en el hash de la URL (enlace de Supabase) — ver extraerTokenDeHash. */
export function RestablecerPasswordForm() {
  const { t } = useTranslation();
  const [token] = useState(() => extraerTokenDeHash(window.location.hash));
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setEstado({ tipo: "enviando" });

    try {
      const respuesta = await fetch("/api/restablecer-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setEstado({ tipo: "error", mensaje: datos.error ?? t("restablecerPassword.errorGenerico") });
        return;
      }

      setEstado({ tipo: "exito" });
    } catch {
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
    }
  }

  const migas = [
    { etiqueta: t("breadcrumbs.inicio"), ruta: "/" },
    { etiqueta: t("breadcrumbs.restablecerContrasena") },
  ];

  if (!token) {
    return (
      <>
        <Breadcrumbs items={migas} />
        <Alert severity="error" sx={{ maxWidth: 360, mx: "auto", mt: 4 }}>
          {t("restablecerPassword.enlaceInvalido")}
        </Alert>
      </>
    );
  }

  if (estado.tipo === "exito") {
    return (
      <>
        <Breadcrumbs items={migas} />
        <Alert severity="success" sx={{ maxWidth: 360, mx: "auto", mt: 4 }}>
          {t("restablecerPassword.exito")}
        </Alert>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={migas} />
      <Box component="form" onSubmit={manejarEnvio} sx={{ maxWidth: 360, mx: "auto", mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("restablecerPassword.titulo")}
        </Typography>
        <Stack spacing={2}>
          {estado.tipo === "error" && <Alert severity="error">{estado.mensaje}</Alert>}
          <TextField
            label={t("restablecerPassword.nuevaContrasena")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={t("comun.contrasenaAyuda")}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={estado.tipo === "enviando"} fullWidth>
            {estado.tipo === "enviando" ? t("restablecerPassword.botonEnviando") : t("restablecerPassword.boton")}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
