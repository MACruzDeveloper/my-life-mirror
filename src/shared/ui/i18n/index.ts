// Config de i18n (RNF-10: ES/EN desde el lanzamiento). Recursos incluidos
// directamente en el bundle (sin backend HTTP) — el catálogo de textos es
// pequeño, así se evita una petición de red extra solo para cargarlos.
//
// Decisión deliberada: sin detección automática del idioma del navegador
// (no se usa i18next-browser-languagedetector). El idioma por defecto es
// español, coherente con el resto del proyecto; el usuario cambia de idioma
// con el selector del Header y esa elección se recuerda en localStorage.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import en from "./locales/en.json";

const SAVED_LANGUAGE_KEY = "mylifemirror_idioma";

function readSavedLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SAVED_LANGUAGE_KEY);
  } catch {
    return null;
  }
}

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: readSavedLanguage() ?? "es",
  fallbackLng: "es",
  interpolation: { escapeValue: false },
  // Sin esto, init() difiere la carga de recursos a un setTimeout: en tests
  // y en SSR el idioma inicial podría no estar listo de forma síncrona.
  initAsync: false,
});

/**
 * El atributo `lang` de la página sigue al idioma elegido: sin esto,
 * `index.html` declaraba siempre un idioma y los lectores de pantalla leían el
 * español con pronunciación inglesa.
 */
function syncDocumentLanguage(language: string) {
  if (typeof document !== "undefined") document.documentElement.lang = language;
}
syncDocumentLanguage(i18n.language);

i18n.on("languageChanged", (language) => {
  syncDocumentLanguage(language);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVED_LANGUAGE_KEY, language);
  } catch {
    // localStorage puede fallar (modo privado, cuota agotada) — no es crítico.
  }
});

export default i18n;
