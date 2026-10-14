import { describe, expect, it } from "vitest";
import atlas from "world-atlas/countries-50m.json";
import { COUNTRIES, isCountryCode } from "@modules/agenda/domain/countries";

describe("lista de países de los viajes (RF-49)", () => {
  it("códigos ISO de dos letras, sin repetidos", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
    for (const country of COUNTRIES) expect(country.code, country.code).toMatch(/^[A-Z]{2}$/);
    expect(new Set(COUNTRIES.map((country) => country.code)).size).toBe(COUNTRIES.length);
  });

  it("cada país tiene nombre en español y en inglés (los da el navegador, sin traducciones propias)", () => {
    for (const language of ["es", "en"]) {
      const names = new Intl.DisplayNames([language], { type: "region" });
      for (const country of COUNTRIES) expect(names.of(country.code), `${language}:${country.code}`).not.toBe(country.code);
    }
  });

  it("cada país se puede pintar: su forma está en el mapa (por su número o, si no tiene, por su nombre)", () => {
    const geometries = (atlas as unknown as { objects: { countries: { geometries: { id?: string; properties: { name: string } }[] } } }).objects.countries.geometries;
    const ids = new Set(geometries.map((geometry) => geometry.id));
    const names = new Set(geometries.map((geometry) => geometry.properties.name));
    for (const country of COUNTRIES) expect(country.numeric ? ids.has(country.numeric) : names.has(country.mapName ?? ""), country.code).toBe(true);
  });

  it("solo vale un código de la lista", () => {
    expect(isCountryCode("MM")).toBe(true);
    expect(isCountryCode("Myanmar")).toBe(false);
  });
});
