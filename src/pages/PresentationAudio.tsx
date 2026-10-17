import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
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
 * sola (solo al pulsar) y el archivo no se descarga hasta entonces; la
 * transcripción, para quien no puede o no quiere escucharla.
 */
export function PresentationAudio() {
  const { t, i18n } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const source = AUDIO[i18n.language] ?? AUDIO.es;
  // Qué audio está sonando: al cambiar de idioma, el de ahora es otro y ya no "suena".
  const [playingSource, setPlayingSource] = useState<string>();
  const playing = playingSource === source;
  // Posición y duración, para la barra; la duración se sabe al empezar a cargar (no antes: no se descarga sola).
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState<number>();
  const started = duration !== undefined;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlayingSource(undefined);
    } else {
      void audio.play();
      setPlayingSource(source);
    }
  }

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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: { xs: "100%", sm: 380 }, maxWidth: "100%", px: 1 }}>
        <IconButton
          onClick={toggle}
          aria-label={playing ? t("landing.audio.pausar") : t("landing.audio.escuchar")}
          sx={{ color: "common.white", border: "1px solid rgba(255, 255, 255, 0.85)", flexShrink: 0, "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" } }}
        >
          {playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
        </IconButton>
        {started ? (
          <>
            {/* Para ver por dónde va, y para ir adelante o atrás. */}
            <Slider
              size="small"
              min={0}
              max={duration}
              step={1}
              value={position}
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
              {formatTime(position)} / {formatTime(duration)}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: "common.white" }}>
            {t("landing.audio.escuchar")}
          </Typography>
        )}
      </Box>
      <Typography variant="caption" sx={{ color: "common.white", opacity: 0.85 }}>
        {t("landing.audio.vozIa")} ·{" "}
        <Link component="button" type="button" onClick={() => setTranscriptOpen(true)} sx={{ color: "inherit", verticalAlign: "baseline", fontSize: "inherit" }}>
          {t("landing.audio.transcripcion")}
        </Link>
      </Typography>
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
