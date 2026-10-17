import { useEffect, useId, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { watchSessionExpiry } from "../api/sessionExpiry";

/**
 * SEC-05: "Tu sesión ha caducado", en cuanto una llamada a la API lo dice (401).
 * Sin cerrarse con un clic fuera: lo único que se puede hacer es volver a entrar.
 * Se monta una vez en la zona protegida (`ProtectedRoute`).
 */
export function SessionExpiredDialog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const titleId = useId();
  const [expired, setExpired] = useState(false);

  useEffect(() => watchSessionExpiry(() => setExpired(true)), []);

  return (
    <Dialog open={expired} aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{t("sesion.caducadaTitulo")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t("sesion.caducadaTexto")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            setExpired(false);
            navigate("/login", { replace: true });
          }}
        >
          {t("sesion.volverAEntrar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
