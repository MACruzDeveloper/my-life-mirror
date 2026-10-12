import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import spanishFlag from "../assets/flags/es.svg";
import englishFlag from "../assets/flags/gb.svg";

const flagSx = { width: 22, height: 15, borderRadius: "2px", boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.12)", cursor: "pointer", display: "block" } as const;

/**
 * Selector de idioma ES/EN (RNF-10), común a la cabecera de las pantallas
 * protegidas y a las páginas públicas: un interruptor entre las dos banderas,
 * activado = inglés. Se llama "English" (con `lang="en"`) en cualquier idioma,
 * para que lo reconozca quien todavía no entiende el actual; pulsar una bandera
 * también elige su idioma. Las banderas son imágenes propias (los emojis de
 * bandera no se ven en Windows) y decorativas: el interruptor lleva el nombre.
 * La elección se recuerda en el dispositivo (ver `i18n/index.ts`).
 *
 * `variant="text"` (UX-08, la portada): sobre la imagen las banderas quedaban
 * mal; ahí son dos botones "ES" y "EN" con una etiqueta pequeña. Cada botón
 * se anuncia con el nombre del idioma en ese idioma.
 */
export function LanguageSwitcher({ variant = "flags" }: { variant?: "flags" | "text" }) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language.startsWith("en");
  const choose = (code: "es" | "en") => void i18n.changeLanguage(code);

  if (variant === "text") {
    const option = (code: "es" | "en", short: string, name: string, selected: boolean) => (
      <ButtonBase
        onClick={() => choose(code)}
        aria-pressed={selected}
        aria-label={name}
        lang={code}
        sx={{ px: 0.75, py: 0.25, borderRadius: 1, font: "inherit", fontSize: "0.875rem", fontWeight: selected ? 700 : 400, opacity: selected ? 1 : 0.7, textDecoration: selected ? "underline" : "none", textUnderlineOffset: "4px", "&:focus-visible": { outline: "2px solid currentColor", outlineOffset: 2 } }}
      >
        {short}
      </ButtonBase>
    );
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="caption" sx={{ opacity: 0.8, mr: 0.5 }}>
          {t("comun.seleccionaIdioma")}
        </Typography>
        {option("es", "ES", "Español", !isEnglish)}
        <Box aria-hidden sx={{ opacity: 0.5 }}>
          |
        </Box>
        {option("en", "EN", "English", isEnglish)}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
      <Box component="img" src={spanishFlag} alt="" sx={[flagSx, { opacity: isEnglish ? 0.5 : 1 }]} onClick={() => choose("es")} />
      <Switch size="small" checked={isEnglish} onChange={(event) => choose(event.target.checked ? "en" : "es")} slotProps={{ input: { role: "switch", "aria-label": "English", lang: "en" } }} />
      <Box component="img" src={englishFlag} alt="" sx={[flagSx, { opacity: isEnglish ? 1 : 0.5 }]} onClick={() => choose("en")} />
    </Box>
  );
}
