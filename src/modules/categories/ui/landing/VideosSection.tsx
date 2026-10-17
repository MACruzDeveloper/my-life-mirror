import { useId, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useTranslation } from "react-i18next";
import { PAGE_MAX_WIDTH } from "@shared/ui/components/Breadcrumbs";
import { type InspirationVideoDto, useInspirationVideos } from "../queries";
import { SECTION_SPACING } from "./landingLayout";

/**
 * RF-49: "Para inspirarte", tres vídeos curados por el autor en la página de
 * una categoría (tres columnas en escritorio, una en móvil), que se gestionan
 * desde administración (ADM-04). Hasta que se pulsa
 * solo se carga la miniatura; el reproductor es el de YouTube sin cookies
 * (`youtube-nocookie.com`), permitido en la política de contenido de `vercel.json`.
 */
export function VideosSection({ categoryKey }: { categoryKey: string }) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const query = useInspirationVideos(categoryKey, i18n.language);
  const videos = Array.isArray(query.data) ? query.data : [];
  // Sin vídeos (o mientras llegan), el bloque no ocupa sitio.
  if (videos.length === 0) return null;

  return (
    <Box sx={{ py: SECTION_SPACING }}>
    <Box component="section" aria-labelledby={titleId} sx={{ maxWidth: PAGE_MAX_WIDTH, mx: "auto", px: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <SmartDisplayOutlinedIcon color="primary" />
        <Typography id={titleId} variant="h6" component="h2">
          {t("videos.titulo")}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {t("videos.intro")}
      </Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
        {videos.map((video) => (
          <Box component="li" key={video.id} sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <VideoCard video={video} />
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("videos.aviso")}
      </Typography>
    </Box>
    </Box>
  );
}

function VideoCard({ video }: { video: InspirationVideoDto }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const title = video.title;

  return (
    <>
      <Box sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "primary.main" }}>
        {playing ? (
          <Box
            component="iframe"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        ) : (
          <ButtonBase onClick={() => setPlaying(true)} aria-label={t("videos.reproducir", { titulo: title })} sx={{ position: "absolute", inset: 0, "&:hover .mlm-play, &:focus-visible .mlm-play": { transform: "scale(1.1)" } }}>
            <Box component="img" src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <PlayCircleFilledIcon className="mlm-play" sx={{ position: "absolute", fontSize: 64, color: "common.white", filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))", transition: "transform 150ms" }} />
          </ButtonBase>
        )}
      </Box>
      <Box sx={{ p: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="subtitle2" component="h3" lang={video.locale}>
          {title}
        </Typography>
        {/* De dónde viene el vídeo (decorativo: el aviso de debajo ya lo dice). */}
        <YouTubeIcon aria-hidden sx={{ color: "text.secondary", flexShrink: 0 }} />
      </Box>
      </Box>
    </>
  );
}
