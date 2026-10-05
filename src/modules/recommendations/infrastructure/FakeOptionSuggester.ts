import type { OptionLabel, OptionSuggester, OptionSuggestion, SuggestOptionsRequest } from "../domain/OptionSuggester.js";

/** Palabras demasiado comunes para decidir nada. */
const STOPWORDS = new Set(["mucha", "mucho", "muchas", "muchos", "cosas", "hacer", "tener", "otras", "otros", "personas", "algo", "about", "other", "people", "things"]);

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function significantWords(label: string): string[] {
  return normalize(label)
    .split(/[^a-z]+/)
    .filter((word) => word.length >= 5 && !STOPWORDS.has(word));
}

/**
 * Raíz aproximada: la palabra sin sus dos últimas letras (al menos 4). Basta para
 * que "viajar" y "viajé", o "comidas" y "comida", cuenten como la misma palabra.
 */
function stem(word: string): string {
  return word.slice(0, Math.max(4, word.length - 2));
}

/**
 * RF-45: proveedor determinista para desarrollo local, E2E y tests, mientras no
 * hay crédito de API (RF-40b). Propone una opción si el texto contiene todas sus
 * palabras significativas, en cualquier forma ("Sitios con mucha gente" → "sitios"
 * y "gente"): con una sola bastaría "gente" para proponer también "Conocer gente
 * nueva", que dice lo contrario. El modelo real entenderá el texto de verdad.
 */
export class FakeOptionSuggester implements OptionSuggester {
  async suggest(request: SuggestOptionsRequest): Promise<OptionSuggestion> {
    const tokens = normalize(request.text).split(/[^a-z]+/).filter(Boolean);
    const appears = (word: string) => tokens.some((token) => token.startsWith(stem(word)));
    const matches = (options: OptionLabel[]) =>
      options.filter(({ label }) => {
        const words = significantWords(label);
        return words.length > 0 && words.every(appears);
      }).map(({ key }) => key);
    return { helps: matches(request.helps), difficulties: matches(request.difficulties) };
  }
}
