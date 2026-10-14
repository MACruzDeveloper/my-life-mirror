import { COUNTRIES } from "@modules/agenda/domain/countries";

/** El nombre de un país en el idioma de la interfaz, del propio navegador (sin traducciones propias). */
export function countryName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Los países de la lista, con su nombre y ordenados como se ordena en ese idioma ("Émiratos" junto a "Egipto"). */
export function countryOptions(language: string): { code: string; name: string }[] {
  const collator = new Intl.Collator(language);
  return COUNTRIES.map((country) => ({ code: country.code, name: countryName(country.code, language) })).sort((a, b) => collator.compare(a.name, b.name));
}

/** "junio de 2015" o "2015", según si se indicó el mes. */
export function tripDate(year: number, month: number | undefined, language: string): string {
  return month === undefined ? String(year) : new Date(year, month - 1, 1).toLocaleDateString(language, { month: "long", year: "numeric" });
}

/** "enero", "febrero"…, en el idioma de la interfaz. */
export function monthNames(language: string): string[] {
  return Array.from({ length: 12 }, (_, index) => new Date(2000, index, 1).toLocaleDateString(language, { month: "long" }));
}
