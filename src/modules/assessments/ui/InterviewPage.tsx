import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import interviewerAvatar from "../../../assets/avatars/interviewer.svg";
import userAvatar from "../../../assets/avatars/user.svg";
import { BandBackground } from "./BandBackground";
import { CATEGORIES_KEY, useCategories, type CategoryDto } from "@modules/categories/ui/queries";
import { InterviewHistory } from "./InterviewHistory";
import { ASSESSMENTS_KEY, LATEST_SCORES_KEY, useLatestScores } from "./queries";
import type { LatestScoreDto } from "./ScoreCards";
import { scoreBand, type ScoreBand } from "./scoreBand";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** El catálogo estándar no tiene slug; se enlaza por nombre con las claves de `ejemplos.*` en i18n. */
const EXAMPLES_KEY: Record<string, string> = {
  Economía: "economia",
  "Vida social": "vidaSocial",
  Pareja: "pareja",
  Sexo: "sexo",
  Deporte: "deporte",
  Aventura: "aventura",
  Espiritualidad: "espiritualidad",
  Familia: "familia",
  Inversiones: "inversiones",
};

type Estado =
  | { tipo: "listo" }
  | { tipo: "guardando" }
  | { tipo: "guardado" }
  | { tipo: "error"; mensaje: string };

/** Icono "i" en círculo (Material) inline — evita añadir la dependencia @mui/icons-material solo para uno. */
function InfoIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </SvgIcon>
  );
}

function omitir<T>(registro: Record<string, T>, clave: string): Record<string, T> {
  const { [clave]: _descartada, ...resto } = registro;
  void _descartada;
  return resto;
}

const POST = (categoryId: string) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ categoryId }),
});

/** Burbuja de conversación — el entrevistador a la izquierda, el usuario a la derecha. */
function Bubble({ children, side, avatar, alt, band }: { children: React.ReactNode; side: "left" | "right"; avatar: string; alt: string; band?: ScoreBand }) {
  const left = side === "left";
  return (
    <Box sx={{ display: "flex", flexDirection: left ? "row" : "row-reverse", alignItems: "flex-start", gap: 1.5 }}>
      <Avatar src={avatar} alt={alt} sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, flexShrink: 0 }} />
      <Box
        data-band={band}
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: left ? "#FFFFFF" : "#F3EFFB",
          border: "1px solid",
          borderColor: left ? "#D9ECE8" : "#E2DAF3",
          borderRadius: left ? "4px 20px 20px 20px" : "20px 4px 20px 20px",
          px: 2,
          py: 1.5,
          minWidth: 0,
          flex: left ? "0 1 auto" : 1,
        }}
      >
        <BandBackground band={band} />
        <Box sx={{ position: "relative" }}>{children}</Box>
      </Box>
    </Box>
  );
}

/**
 * Vista de RF-10 — la "entrevista personal", siempre editable. Mobile-first
 * (ADR-07 §6). Diseño relajado a propósito (paleta suave, esquinas
 * redondeadas, mucho aire, tono de conversación); los avatares son imágenes
 * por defecto — el catálogo real llega con RF-26.
 *
 * No hay "entrevistas nuevas": la pantalla muestra el estado actual (categorías
 * marcadas = activas, con su última puntuación precargada) y el usuario lo
 * cambia cuando quiera. Cambiar una puntuación **inserta** una evaluación
 * nueva — nunca se sobrescribe una anterior (RF-12, y el histórico servirá a
 * RF-14). Marcar/desmarcar una categoría la activa/desactiva (RF-07, con
 * consentimiento para las sensibles, RF-04). Puntuar es opcional por
 * categoría. Diez botones en vez de un slider: un slider siempre tiene un
 * valor por defecto (un 5 preseleccionado sesgaría los datos).
 * Ver docs/user-stories/RF-10-entrevista.md.
 */
export function InterviewPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const categoriasQuery = useCategories();
  const ultimasQuery = useLatestScores();
  const categorias = categoriasQuery.data ?? [];
  // Solo lo que el usuario ha cambiado en esta pantalla; el resto sale de la última puntuación guardada.
  const [borradores, setBorradores] = useState<Record<string, number>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [notasAbiertas, setNotasAbiertas] = useState<Record<string, boolean>>({});
  const [ejemplosAbiertos, setEjemplosAbiertos] = useState<Record<string, boolean>>({});
  const [pendienteConsentimiento, setPendienteConsentimiento] = useState<CategoryDto | null>(null);
  const [enviandoConsentimiento, setEnviandoConsentimiento] = useState(false);
  // Categorías con una petición en curso: evita dobles clics contradictorios y enseña un indicador en las sensibles.
  const [enCurso, setEnCurso] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<Estado>({ tipo: "listo" });

  const ultimas: Record<string, number> = {};
  for (const u of ultimasQuery.data ?? []) if (u.score !== undefined) ultimas[u.categoryId] = u.score;
  const scores: Record<string, number> = { ...ultimas, ...borradores };

  const activas = categorias.filter((c) => c.status === "active");
  const libres = categorias.filter((c) => !c.isSensitiveData);
  const sensibles = categorias.filter((c) => c.isSensitiveData);
  const todasActivas = libres.length > 0 && libres.every((c) => c.status === "active");
  const algunaActiva = activas.length > 0;
  const algunaLibreActiva = libres.some((c) => c.status === "active");
  const cambios = activas.filter((c) => scores[c.id] !== undefined && (scores[c.id] !== ultimas[c.id] || notas[c.id]?.trim()));

  function fijarEstado(id: string, status: "active" | "inactive") {
    queryClient.setQueryData<CategoryDto[]>(CATEGORIES_KEY, (actuales) => actuales?.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  function marcarEnCurso(id: string, activo: boolean) {
    setEnCurso((actuales) => {
      const siguiente = new Set(actuales);
      if (activo) siguiente.add(id);
      else siguiente.delete(id);
      return siguiente;
    });
  }

  /** Activar/desactivar cambia qué categorías cuentan en resultados: se pide de nuevo en segundo plano. */
  function refrescarResultados() {
    void queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
  }

  /**
   * Elegir una categoría que aún no se sigue la activa (RF-07). Las no
   * sensibles se marcan al instante y se deshacen si el servidor falla (la
   * API tarda cientos de ms; esperar para pintar un clic parece que no
   * funciona). Las sensibles no pueden ser optimistas — el servidor puede
   * pedir consentimiento (RF-04) — y muestran un indicador mientras tanto.
   */
  async function activar(categoria: CategoryDto) {
    if (enCurso.has(categoria.id)) return;
    marcarEnCurso(categoria.id, true);
    const optimista = !categoria.isSensitiveData;
    if (optimista) fijarEstado(categoria.id, "active");

    try {
      const respuesta = await fetch("/api/categories/activate", POST(categoria.id));
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        if (optimista) fijarEstado(categoria.id, "inactive");
        if (datos.code === "CONSENT_REQUIRED") {
          setPendienteConsentimiento(categoria);
        } else {
          setEstado({ tipo: "error", mensaje: datos.error ?? t("entrevista.errorActivar") });
        }
        return false;
      }

      fijarEstado(categoria.id, "active");
      refrescarResultados();
      return true;
    } catch {
      if (optimista) fijarEstado(categoria.id, "inactive");
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
      return false;
    } finally {
      marcarEnCurso(categoria.id, false);
    }
  }

  async function desactivar(categoria: CategoryDto) {
    if (enCurso.has(categoria.id)) return;
    marcarEnCurso(categoria.id, true);
    fijarEstado(categoria.id, "inactive");
    // Lo que estaba a medias de esa categoría se descarta; las evaluaciones ya guardadas se conservan.
    setBorradores((actuales) => omitir(actuales, categoria.id));
    setNotas((actuales) => omitir(actuales, categoria.id));

    try {
      const respuesta = await fetch("/api/categories/deactivate", POST(categoria.id));
      if (!respuesta.ok) {
        const datos = await respuesta.json();
        fijarEstado(categoria.id, "active");
        setEstado({ tipo: "error", mensaje: datos.error ?? t("entrevista.errorActivar") });
        return;
      }
      refrescarResultados();
    } catch {
      fijarEstado(categoria.id, "active");
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
    } finally {
      marcarEnCurso(categoria.id, false);
    }
  }

  function alternar(categoria: CategoryDto) {
    if (categoria.status === "active") void desactivar(categoria);
    else void activar(categoria);
  }

  async function confirmarConsentimiento() {
    if (!pendienteConsentimiento) return;
    const categoria = pendienteConsentimiento;
    setEnviandoConsentimiento(true);

    try {
      const respuesta = await fetch("/api/consent/grant", POST(categoria.id));
      if (!respuesta.ok) {
        const datos = await respuesta.json();
        setEstado({ tipo: "error", mensaje: datos.error ?? t("entrevista.errorActivar") });
        return;
      }
      await activar(categoria);
    } finally {
      setEnviandoConsentimiento(false);
      setPendienteConsentimiento(null);
    }
  }

  /**
   * "Seleccionar todas" actúa solo sobre la columna sin consentimiento: las
   * sensibles se marcan una a una (el consentimiento, RF-04, es por
   * categoría). Con todas marcadas, desmarcar las desactiva.
   */
  async function alternarTodas() {
    if (todasActivas) {
      await Promise.all(libres.map(desactivar));
      return;
    }
    await Promise.all(libres.filter((c) => c.status === "inactive").map(activar));
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado({ tipo: "guardando" });

    try {
      const respuesta = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: cambios.map((c) => ({
            categoryId: c.id,
            score: scores[c.id],
            ...(notas[c.id]?.trim() ? { note: notas[c.id].trim() } : {}),
          })),
        }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setEstado({ tipo: "error", mensaje: datos.error ?? t("entrevista.errorGenerico") });
        return;
      }

      // La caché se actualiza al momento con lo guardado (Resultados/Inicio ya lo ven) y se confirma en segundo plano.
      queryClient.setQueryData<LatestScoreDto[]>(LATEST_SCORES_KEY, (actuales) =>
        actuales?.map((u) => (borradores[u.categoryId] !== undefined && cambios.some((c) => c.id === u.categoryId) ? { ...u, score: borradores[u.categoryId] } : u)),
      );
      setBorradores({});
      setNotas({});
      setNotasAbiertas({});
      void queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
      setEstado({ tipo: "guardado" });
    } catch {
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
    }
  }

  const filaCategoria = (categoria: CategoryDto) => (
    <Box key={categoria.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <FormControlLabel
      control={<Checkbox checked={categoria.status === "active"} onChange={() => alternar(categoria)} />}
      label={
        <Box>
          <Typography variant="body1" component="span">
            {categoria.name}
          </Typography>
          {categoria.description && (
            <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block" }}>
              {categoria.description}
            </Typography>
          )}
        </Box>
      }
    />
  {enCurso.has(categoria.id) && categoria.isSensitiveData && (
      <CircularProgress size={16} aria-label={categoria.name} />
    )}
    </Box>
  );

  if (categoriasQuery.isPending || ultimasQuery.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 300px" }, alignItems: "start", mt: { xs: 1, sm: 3 } }}>
    <Box
      component="form"
      onSubmit={guardar}
      sx={{
        p: { xs: 2, sm: 4 },
        borderRadius: 4,
        background: "linear-gradient(180deg, #F2F9F7 0%, #F7F5FC 100%)",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Typography variant="h5" component="h1">
        {t("entrevista.titulo")}
      </Typography>

      <Bubble side="left" avatar={interviewerAvatar} alt={t("entrevista.entrevistador")}>
        <Typography variant="body1">{t("entrevista.descripcion")}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t("entrevista.escala")}
        </Typography>
      </Bubble>

      {(categoriasQuery.isError || ultimasQuery.isError) && <Alert severity="error">{t("entrevista.errorCarga")}</Alert>}
      {estado.tipo === "error" && <Alert severity="error">{estado.mensaje}</Alert>}
      {estado.tipo === "guardado" && (
        <Alert severity="success">
          {t("entrevista.exito")}{" "}
          <Link component={RouterLink} to="/perfil/resultados">
            {t("entrevista.verResultados")}
          </Link>
        </Alert>
      )}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, alignItems: "start" }}>
        <Box role="group" aria-labelledby="columna-libres" sx={{ bgcolor: "#FFFFFF", borderRadius: 3, border: "1px solid #E4EAE8", p: 2 }}>
          <Typography id="columna-libres" variant="subtitle1" sx={{ mb: 1 }}>
            {t("entrevista.elegirTitulo")}
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={todasActivas} indeterminate={algunaLibreActiva && !todasActivas} onChange={() => void alternarTodas()} />}
            label={t("entrevista.seleccionarTodas")}
          />
          <Box sx={{ display: "flex", flexDirection: "column", pl: 3 }}>{libres.map(filaCategoria)}</Box>
        </Box>
        <Box role="group" aria-labelledby="columna-sensibles" sx={{ bgcolor: "#FBF8FF", borderRadius: 3, border: "1px solid #E2DAF3", p: 2 }}>
          <Typography id="columna-sensibles" variant="subtitle1" sx={{ mb: 0.5 }}>
            {t("entrevista.sensiblesTitulo")}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {t("entrevista.sensiblesExplicacion")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column" }}>{sensibles.map(filaCategoria)}</Box>
        </Box>
      </Box>

      {activas.map((categoria) => (
        <Box key={categoria.id} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Bubble side="left" avatar={interviewerAvatar} alt={t("entrevista.entrevistador")}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="body1">{t("entrevista.pregunta", { categoria: categoria.name })}</Typography>
              {EXAMPLES_KEY[categoria.name] && (
                <IconButton
                  size="small"
                  aria-label={t("entrevista.verEjemplos", { categoria: categoria.name })}
                  aria-expanded={ejemplosAbiertos[categoria.id] === true}
                  onClick={() => setEjemplosAbiertos((actuales) => ({ ...actuales, [categoria.id]: !actuales[categoria.id] }))}
                >
                  <InfoIcon />
                </IconButton>
              )}
            </Box>
            {EXAMPLES_KEY[categoria.name] && (
              <Collapse in={ejemplosAbiertos[categoria.id] === true}>
                <Typography variant="caption" color="text.secondary">
                  {t("entrevista.ejemplosTitulo")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                  {(t(`ejemplos.${EXAMPLES_KEY[categoria.name]}`, { returnObjects: true }) as string[]).map((ejemplo) => (
                    <Typography key={ejemplo} component="li" variant="body2">
                      {ejemplo}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            )}
          </Bubble>
          <Bubble side="right" avatar={userAvatar} alt={t("entrevista.tu")} band={scores[categoria.id] !== undefined ? scoreBand(scores[categoria.id]) : undefined}>
            <Box role="group" aria-label={t("entrevista.puntuacionDe", { categoria: categoria.name })} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {SCORES.map((valor) => {
                return (
                  <ToggleButton
                    key={valor}
                    value={valor}
                    size="small"
                    selected={scores[categoria.id] === valor}
                    onChange={() => setBorradores((actuales) => ({ ...actuales, [categoria.id]: valor }))}
                    sx={{ minWidth: 40, "&.Mui-selected": { fontWeight: 700 } }}
                  >
                    {valor}
                  </ToggleButton>
                );
              })}
            </Box>
            {notasAbiertas[categoria.id] ? (
              <TextField
                label={t("entrevista.nota")}
                value={notas[categoria.id] ?? ""}
                onChange={(e) => setNotas((actuales) => ({ ...actuales, [categoria.id]: e.target.value }))}
                slotProps={{ htmlInput: { maxLength: 500 } }}
                size="small"
                fullWidth
                sx={{ mt: 1.5 }}
              />
            ) : (
              <Button size="small" onClick={() => setNotasAbiertas((actuales) => ({ ...actuales, [categoria.id]: true }))} sx={{ mt: 0.5 }}>
                {t("entrevista.anadirNota")}
              </Button>
            )}
          </Bubble>
        </Box>
      ))}

      {cambios.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {algunaActiva ? t("entrevista.sinCambios") : t("entrevista.elegirAlgo")}
        </Typography>
      )}
      <Button type="submit" variant="contained" size="large" fullWidth disabled={cambios.length === 0 || estado.tipo === "guardando"}>
        {estado.tipo === "guardando" ? t("entrevista.guardando") : t("entrevista.guardar")}
      </Button>

      <Dialog open={pendienteConsentimiento !== null} onClose={() => setPendienteConsentimiento(null)}>
        <DialogTitle>{t("categorias.modalTitulo")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("categorias.modalTexto", { categoria: pendienteConsentimiento?.name ?? "" })}</DialogContentText>
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
    <InterviewHistory />
    </Box>
  );
}
