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
import { AiIdeasSection, AiSuggestionsSection } from "./AiOptInSection";

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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  async function exportData() {
    setExporting(true);
    setExportError(false);
    try {
      const response = await fetch("/api/accounts/export-data");
      if (!response.ok) throw new Error("fallo");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "mylifemirror-mis-datos.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  function closeDialog() {
    if (deleting) return;
    setDialogOpen(false);
    setPassword("");
    setDeleteError(undefined);
  }

  async function remove() {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      const response = await fetch("/api/accounts/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const data = await response.json();
        // 409 = es el único administrador: siempre debe existir uno (mensaje propio, traducido).
        setDeleteError(response.status === 409 ? t("datos.errorUltimoAdmin") : (data.error ?? t("datos.errorEliminar")));
        return;
      }
      // La cuenta ya no existe: nada de sus datos debe quedar en memoria.
      queryClient.clear();
      navigate("/", { replace: true });
    } catch {
      setDeleteError(t("comun.errorServidor"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 560, mx: { xs: 0, md: "auto" }, mt: { xs: 1, sm: 3 }, display: "flex", flexDirection: "column", gap: 4 }}>
      <Typography variant="h5" component="h1">
        {t("datos.titulo")}
      </Typography>

      <AiIdeasSection />
      <AiSuggestionsSection />
      <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="subtitle1" component="h2">
          {t("datos.exportarTitulo")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("datos.exportarTexto")}
        </Typography>
        {exportError && <Alert severity="error">{t("datos.errorExportar")}</Alert>}
        <Box>
          <Button variant="contained" onClick={() => void exportData()} disabled={exporting}>
            {exporting ? t("datos.exportando") : t("datos.exportar")}
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
          <Button variant="outlined" color="error" onClick={() => setDialogOpen(true)}>
            {t("datos.eliminar")}
          </Button>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>{t("datos.dialogoTitulo")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t("datos.dialogoTexto")}</DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
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
          <Button onClick={closeDialog} disabled={deleting}>
            {t("datos.cancelar")}
          </Button>
          <Button onClick={() => void remove()} color="error" variant="contained" disabled={password.length === 0 || deleting}>
            {deleting ? t("datos.eliminando") : t("datos.confirmar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
