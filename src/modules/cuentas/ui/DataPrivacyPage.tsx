import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

/**
 * Vista de RF-05 (y RNF-12): descargar mis datos y eliminar mi cuenta. Ambas
 * son acciones explícitas del usuario, no lecturas de pantalla, así que no
 * pasan por la caché de datos. Eliminar exige la contraseña, que se comprueba
 * en el servidor; al terminar se vacía la caché y se vuelve a la página pública.
 * Ver docs/user-stories/RF-05-exportar-eliminar-datos.md.
 */
export function DataPrivacyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [password, setPassword] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | undefined>();

  async function exportar() {
    setExportando(true);
    setErrorExportar(false);
    try {
      const respuesta = await fetch("/api/accounts/export-data");
      if (!respuesta.ok) throw new Error("fallo");
      const url = URL.createObjectURL(await respuesta.blob());
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "mylifemirror-mis-datos.json";
      enlace.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorExportar(true);
    } finally {
      setExportando(false);
    }
  }

  function cerrarDialogo() {
    if (eliminando) return;
    setDialogoAbierto(false);
    setPassword("");
    setErrorEliminar(undefined);
  }

  async function eliminar() {
    setEliminando(true);
    setErrorEliminar(undefined);
    try {
      const respuesta = await fetch("/api/accounts/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json();
        // 409 = es el único administrador: siempre debe existir uno (mensaje propio, traducido).
        setErrorEliminar(respuesta.status === 409 ? t("datos.errorUltimoAdmin") : (datos.error ?? t("datos.errorEliminar")));
        return;
      }
      // La cuenta ya no existe: nada de sus datos debe quedar en memoria.
      queryClient.clear();
      navigate("/", { replace: true });
    } catch {
      setErrorEliminar(t("comun.errorServidor"));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 560, mx: { xs: 0, md: "auto" }, mt: { xs: 1, sm: 3 }, display: "flex", flexDirection: "column", gap: 4 }}>
      <Typography variant="h5" component="h1">
        {t("datos.titulo")}
      </Typography>

      <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="subtitle1" component="h2">
          {t("datos.exportarTitulo")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("datos.exportarTexto")}
        </Typography>
        {errorExportar && <Alert severity="error">{t("datos.errorExportar")}</Alert>}
        <Box>
          <Button variant="contained" onClick={() => void exportar()} disabled={exportando}>
            {exportando ? t("datos.exportando") : t("datos.exportar")}
          </Button>
        </Box>
      </Box>

      <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2, border: 1, borderColor: "error.light", borderRadius: 3 }}>
        <Typography variant="subtitle1" component="h2">
          {t("datos.eliminarTitulo")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("datos.eliminarTexto")}
        </Typography>
        <Box>
          <Button variant="outlined" color="error" onClick={() => setDialogoAbierto(true)}>
            {t("datos.eliminar")}
          </Button>
        </Box>
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="xs">
        <DialogTitle>{t("datos.dialogoTitulo")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t("datos.dialogoTexto")}</DialogContentText>
          {errorEliminar && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorEliminar}
            </Alert>
          )}
          <TextField
            label={t("datos.contrasena")}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} disabled={eliminando}>
            {t("datos.cancelar")}
          </Button>
          <Button onClick={() => void eliminar()} color="error" variant="contained" disabled={password.length === 0 || eliminando}>
            {eliminando ? t("datos.eliminando") : t("datos.confirmar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
