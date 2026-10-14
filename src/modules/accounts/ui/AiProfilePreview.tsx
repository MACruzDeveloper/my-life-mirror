import { useId } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { useOptionalSession } from "@shared/ui/context/SessionContext";
import { useProfile } from "./queries";

interface AiProfilePreviewProps {
  /** Lo que hay ahora en el formulario (aunque no se haya guardado): se ve al momento. */
  occupation: string;
  hobbies: readonly string[];
}

/**
 * "Así te ve la IA" (RF-40, RF-46), junto al formulario del perfil: qué datos
 * de este perfil recibiría la IA para adaptar las ideas y cuáles nunca, según
 * lo que se está rellenando. Dice si la función está activada y lleva a
 * Privacidad y datos para cambiarlo. No llama a la IA: solo lo explica.
 */
export function AiProfilePreview({ occupation, hobbies }: AiProfilePreviewProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const available = useOptionalSession()?.aiIdeasAvailable === true;
  const enabled = useProfile(available).data?.aiIdeasEnabled === true;
  const fromProfile = [...(occupation ? [t(`perfil.ocupaciones.${occupation}`)] : []), ...hobbies.map((hobby) => t(`perfil.aficiones.${hobby}`))];

  return (
    <Box component="aside" aria-labelledby={titleId} sx={{ p: 2.5, border: 1, borderColor: "divider", bgcolor: "background.default", display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeOutlinedIcon fontSize="small" color="secondary" />
        <Typography id={titleId} variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
          {t("perfilIa.titulo")}
        </Typography>
      </Box>
      {!available ? (
        <Typography variant="body2" color="text.secondary">
          {t("perfilIa.noDisponible")}
        </Typography>
      ) : (
        <>
          <Typography variant="body2">{t(enabled ? "perfilIa.activadas" : "perfilIa.desactivadas")}</Typography>
          <Box>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ fontWeight: 600 }}>
              {t(enabled ? "perfilIa.recibe" : "perfilIa.recibiria")}
            </Typography>
            {fromProfile.length > 0 ? (
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                {fromProfile.map((item) => (
                  <Typography key={item} component="li" variant="body2">
                    {item}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("perfilIa.nadaDelPerfil")}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
              {t("perfilIa.ademas")}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ fontWeight: 600 }}>
              {t("perfilIa.nunca")}
            </Typography>
            <Typography variant="body2">{t("perfilIa.nuncaLista")}</Typography>
          </Box>
          <Link component={RouterLink} to="/perfil/datos" variant="body2">
            {t(enabled ? "perfilIa.cambiar" : "perfilIa.activar")}
          </Link>
        </>
      )}
    </Box>
  );
}
