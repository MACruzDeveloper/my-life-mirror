import { useId, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import { useTranslation } from "react-i18next";
import { PAGE_MAX_WIDTH } from "@shared/ui/components/Breadcrumbs";
import { type InspirationVideo, inspirationVideosFor } from "@modules/categories/domain/inspirationVideos";

/**
 * RF-49: "Para inspirarte", tres vídeos curados por el autor en la página de
 * una categoría (tres columnas en escritorio, una en móvil). Hasta que se pulsa
 * solo se carga la miniatura; el reproductor es el de YouTube sin cookies
 * (`youtube-nocookie.com`), permitido en la política de contenido de `vercel.json`.
 */
export function VideosSection({ categoryKey }: { categoryKey: string }) {
  const { t } = useTranslation();
  const titleId = useId();
  const videos = inspirationVideosFor(categoryKey);
  if (videos.length === 0) return null;

  return (
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
          <Box component="li" key={video.key} sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <VideoCard video={video} />
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("videos.aviso")}
      </Typography>
    </Box>
  );
}

function VideoCard({ video }: { video: InspirationVideo }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const title = t(`videos.${video.key}`);

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
          <ButtonBase onClick={() => setPlaying(true)} aria-label={t("videos.reproducir", { titulo: title, ponente: video.speaker })} sx={{ position: "absolute", inset: 0, "&:hover .mlm-play, &:focus-visible .mlm-play": { transform: "scale(1.1)" } }}>
            <Box component="img" src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <PlayCircleFilledIcon className="mlm-play" sx={{ position: "absolute", fontSize: 64, color: "common.white", filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))", transition: "transform 150ms" }} />
          </ButtonBase>
        )}
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Typography variant="subtitle2" component="h3">
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {video.speaker}
        </Typography>
      </Box>
    </>
  );
}
