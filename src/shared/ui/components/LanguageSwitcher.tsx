import Button from "@mui/material/Button";
import { useTranslation } from "react-i18next";

/**
 * Selector de idioma ES/EN (RNF-10), común a la cabecera de las pantallas
 * protegidas y a las páginas públicas. El botón se nombra en el idioma de
 * destino ("English" / "Español", con su atributo `lang`) para que lo
 * reconozca quien todavía no entiende el idioma actual. La elección se
 * recuerda en el dispositivo (ver `i18n/index.ts`).
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language.startsWith("es");
  const target = isSpanish ? { code: "en", label: "English", short: "EN" } : { code: "es", label: "Español", short: "ES" };

  return (
    <Button size="small" lang={target.code} aria-label={target.label} onClick={() => void i18n.changeLanguage(target.code)}>
      {target.short}
    </Button>
  );
}
