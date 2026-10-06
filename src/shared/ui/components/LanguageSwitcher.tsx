import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
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
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language.startsWith("en");
  const choose = (code: "es" | "en") => void i18n.changeLanguage(code);

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
      <Box component="img" src={spanishFlag} alt="" sx={[flagSx, { opacity: isEnglish ? 0.5 : 1 }]} onClick={() => choose("es")} />
      <Switch size="small" checked={isEnglish} onChange={(event) => choose(event.target.checked ? "en" : "es")} slotProps={{ input: { role: "switch", "aria-label": "English", lang: "en" } }} />
      <Box component="img" src={englishFlag} alt="" sx={[flagSx, { opacity: isEnglish ? 1 : 0.5 }]} onClick={() => choose("en")} />
    </Box>
  );
}
