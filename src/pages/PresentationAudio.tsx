import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { PALETTE } from "@shared/ui/theme";
import Slider from "@mui/material/Slider";
import Grow from "@mui/material/Grow";
import { prefersReducedMotion } from "@shared/ui/motion";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { useTranslation } from "react-i18next";
import presentationEs from "../assets/audio/presentacion-es.mp3";
import presentationEn from "../assets/audio/presentacion-en.mp3";

/** Un audio por idioma de la interfaz (español por defecto). */
const AUDIO: Record<string, string> = { es: presentationEs, en: presentationEn };

/**
 * La presentación de la app en audio, en la portada: voz generada con IA
 * (ElevenLabs) a partir de un texto fijo, sin ningún dato de nadie. No suena
 * sola (solo al pulsar) y el archivo no se descarga hasta entonces. Antes de
 * pulsar, solo el botón; al empezar aparecen la barra, el tiempo, el aviso de
 * voz generada con IA y la transcripción.
 */
export function PresentationAudio() {
  const { t, i18n } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const source = AUDIO[i18n.language] ?? AUDIO.es;
  // Qué audio está sonando: al cambiar de idioma, el de ahora es otro y ya no "suena".
  const [playingSource, setPlayingSource] = useState<string>();
  const playing = playingSource === source;
  // Abierto: tras pulsar, con la barra, el tiempo y el aviso; cerrado, solo el botón (el estado inicial).
  const [open, setOpen] = useState(false);
  // Posición y duración, para la barra; la duración se sabe al empezar a cargar (no antes: no se descarga sola).
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState<number>();
  const growTimeout = prefersReducedMotion() ? 0 : 1000;

  function play() {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play();
    setPlayingSource(source);
    setOpen(true);
  }

  function toggle() {
    if (!playing) return play();
    audioRef.current?.pause();
    setPlayingSource(undefined);
  }

  /** Vuelve al estado inicial: se para, vuelve al principio y se recoge. */
  function close() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingSource(undefined);
    setPosition(0);
    setOpen(false);
  }

  /** Borde de color (el acento de la marca) en los botones redondos del reproductor. */
  const roundButtonSx = { color: "common.white", border: `2px solid ${PALETTE.countryBlue}`, flexShrink: 0, "&:hover": { bgcolor: "rgba(107, 158, 168, 0.25)" } };

  return (
    <Box sx={{ mt: 2.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      {/* Con `key`: al cambiar de idioma se monta otro, y el que sonaba se para. */}
      <audio
        key={source}
        ref={audioRef}
        src={source}
        preload="none"
        onEnded={() => setPlayingSource(undefined)}
        onPause={() => setPlayingSource(undefined)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
      />
      {open ? (
        // De pequeño a grande y de transparente a visible, en 1 segundo (sin animación si se pide menos movimiento).
        <Grow in timeout={growTimeout}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: { xs: "100%", sm: 400 }, maxWidth: "100%", px: 1 }}>
            <IconButton size="small" onClick={toggle} aria-label={playing ? t("landing.audio.pausar") : t("landing.audio.escuchar")} sx={roundButtonSx}>
              {playing ? <PauseRoundedIcon fontSize="small" /> : <PlayArrowRoundedIcon fontSize="small" />}
            </IconButton>
            {/* Para ver por dónde va, y para ir adelante o atrás. */}
            <Slider
              size="small"
              min={0}
              max={duration ?? 0}
              step={1}
              value={position}
              disabled={duration === undefined}
              aria-label={t("landing.audio.posicion")}
              getAriaValueText={(value) => formatTime(value)}
              onChange={(_, value) => {
                const audio = audioRef.current;
                if (!audio) return;
                audio.currentTime = value as number;
                setPosition(value as number);
              }}
              sx={{ color: "common.white", flex: 1 }}
            />
            <Typography variant="caption" sx={{ color: "common.white", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {formatTime(position)} / {duration === undefined ? "–:––" : formatTime(duration)}
            </Typography>
            <IconButton size="small" onClick={close} aria-label={t("landing.audio.cerrar")} sx={{ color: "common.white", opacity: 0.85 }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Grow>
      ) : (
        // Antes de pulsar: un solo botón, el icono y el texto, centrado (la imagen se ve más).
        <ButtonBase onClick={play} sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, px: 1, py: 0.5, borderRadius: 999, color: "common.white", "&:hover .mlm-play, &:focus-visible .mlm-play": { bgcolor: "rgba(107, 158, 168, 0.25)" } }}>
          <Box className="mlm-play" sx={{ ...roundButtonSx, display: "inline-flex", p: 0.75, borderRadius: "50%" }}>
            <PlayArrowRoundedIcon fontSize="small" />
          </Box>
          <Typography variant="body2" component="span">
            {t("landing.audio.escuchar")}
          </Typography>
        </ButtonBase>
      )}
      {open && (
        <Grow in timeout={growTimeout}>
          <Typography variant="caption" sx={{ color: "common.white", opacity: 0.85 }}>
            {t("landing.audio.vozIa")} ·{" "}
            <Link component="button" type="button" onClick={() => setTranscriptOpen(true)} sx={{ color: "inherit", verticalAlign: "baseline", fontSize: "inherit" }}>
              {t("landing.audio.transcripcion")}
            </Link>
          </Typography>
        </Grow>
      )}
      <Dialog open={transcriptOpen} onClose={() => setTranscriptOpen(false)} aria-labelledby="transcripcion-titulo">
        <DialogTitle id="transcripcion-titulo">{t("landing.audio.transcripcionTitulo")}</DialogTitle>
        <DialogContent>
          {(t("landing.audio.texto", { returnObjects: true }) as string[]).map((paragraph) => (
            <Typography key={paragraph} variant="body2" sx={{ mb: 1.5 }}>
              {paragraph}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTranscriptOpen(false)}>{t("comun.cerrar")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/** "0:12": minutos y segundos. */
function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
