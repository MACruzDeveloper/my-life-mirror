import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useAssessmentHistory } from "./queries";

/**
 * Registro de cambios del usuario, en un lateral junto a la entrevista: qué
 * guardó y cuándo, con "antes → ahora" cuando cambió una puntuación. No es la
 * evolución gráfica (RF-14): solo una lista. Se refresca cuando la entrevista
 * invalida la caché de `assessments` tras guardar.
 */
export function InterviewHistory() {
  const { t, i18n } = useTranslation();
  const { data: sesiones } = useAssessmentHistory();

  const fecha = (iso: string) => new Date(iso).toLocaleDateString(i18n.language, { month: "long", year: "numeric", day: "numeric" });

  return (
    <Box component="aside" aria-labelledby="historial-titulo" sx={{ bgcolor: "#FFFFFF", border: "1px solid #E4EAE8", borderRadius: 3, p: 2 }}>
      <Typography id="historial-titulo" variant="subtitle1" component="h2" sx={{ mb: 1 }}>
        {t("entrevista.historialTitulo")}
      </Typography>
      {sesiones && sesiones.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t("entrevista.historialVacio")}
        </Typography>
      )}
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {(sesiones ?? []).map((sesion) => (
          <Box component="li" key={sesion.recordedAt}>
            <Typography variant="caption" color="text.secondary">
              {fecha(sesion.recordedAt)}
            </Typography>
            {sesion.entries.map((entrada) => (
              <Typography key={entrada.categoryId} variant="body2">
                {entrada.categoryName}:{" "}
                {entrada.previousScore !== undefined ? `${entrada.previousScore} → ${entrada.score}` : entrada.score}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
