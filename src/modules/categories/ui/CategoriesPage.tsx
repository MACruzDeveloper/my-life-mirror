import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

interface CategoryDto {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  isSensitiveData: boolean;
}

type Estado = { tipo: "cargando" } | { tipo: "listo" } | { tipo: "error"; mensaje: string };

/**
 * Vista de RF-06/RF-07. Mobile-first (ADR-07 §6): una sola columna de
 * filas, sin adaptación adicional a tablet/escritorio — no hace falta más
 * para una lista de 9 elementos. El modal de consentimiento (RF-04) es el
 * disparador real que el resto del módulo consentimiento estaba esperando
 * (ver docs/requirements-analysis/08_Diagrama_Secuencia_Consentimiento.md).
 */
export function CategoriesPage() {
  const { t } = useTranslation();
  const [categorias, setCategorias] = useState<CategoryDto[]>([]);
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [pendienteConsentimiento, setPendienteConsentimiento] = useState<CategoryDto | null>(null);
  const [enviandoConsentimiento, setEnviandoConsentimiento] = useState(false);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/categories")
      .then((respuesta) => respuesta.json())
      .then((datos: CategoryDto[]) => {
        if (cancelado) return;
        setCategorias(datos);
        setEstado({ tipo: "listo" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "error", mensaje: t("categorias.errorCarga") });
      });

    return () => {
      cancelado = true;
    };
  }, [t]);

  function actualizarCategoria(actualizada: CategoryDto) {
    setCategorias((actuales) => actuales.map((c) => (c.id === actualizada.id ? actualizada : c)));
  }

  async function activar(categoria: CategoryDto) {
    const respuesta = await fetch("/api/categories/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: categoria.id }),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      if (datos.code === "CONSENT_REQUIRED") {
        setPendienteConsentimiento(categoria);
        return;
      }
      setEstado({ tipo: "error", mensaje: datos.error ?? t("categorias.errorGenerico") });
      return;
    }

    actualizarCategoria(datos);
  }

  async function desactivar(categoria: CategoryDto) {
    const respuesta = await fetch("/api/categories/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: categoria.id }),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      setEstado({ tipo: "error", mensaje: datos.error ?? t("categorias.errorGenerico") });
      return;
    }

    actualizarCategoria(datos);
  }

  function alternar(categoria: CategoryDto) {
    if (categoria.status === "active") {
      void desactivar(categoria);
    } else {
      void activar(categoria);
    }
  }

  async function confirmarConsentimiento() {
    if (!pendienteConsentimiento) return;
    const categoria = pendienteConsentimiento;
    setEnviandoConsentimiento(true);

    try {
      const respuesta = await fetch("/api/consent/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: categoria.id }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json();
        setEstado({ tipo: "error", mensaje: datos.error ?? t("categorias.errorGenerico") });
        return;
      }

      await activar(categoria);
    } finally {
      setEnviandoConsentimiento(false);
      setPendienteConsentimiento(null);
    }
  }

  if (estado.tipo === "cargando") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: { xs: "100%", sm: 560 }, mx: "auto", mt: 4, px: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t("categorias.titulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("categorias.descripcion")}
      </Typography>
      {estado.tipo === "error" && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {estado.mensaje}
        </Alert>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {categorias.map((categoria) => (
          <Box
            key={categoria.id}
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box>
              <Typography variant="body1">{categoria.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {categoria.description}
              </Typography>
            </Box>
            <Switch
              checked={categoria.status === "active"}
              onChange={() => alternar(categoria)}
              slotProps={{ input: { "aria-label": categoria.name } }}
            />
          </Box>
        ))}
      </Box>

      <Dialog open={pendienteConsentimiento !== null} onClose={() => setPendienteConsentimiento(null)}>
        <DialogTitle>{t("categorias.modalTitulo")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("categorias.modalTexto", { categoria: pendienteConsentimiento?.name ?? "" })}
          </DialogContentText>
          <Link href="/politica-privacidad" target="_blank" rel="noopener noreferrer">
            {t("categorias.leerPolitica")}
          </Link>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendienteConsentimiento(null)}>{t("categorias.modalCancelar")}</Button>
          <Button onClick={confirmarConsentimiento} variant="contained" disabled={enviandoConsentimiento}>
            {t("categorias.modalAceptar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
