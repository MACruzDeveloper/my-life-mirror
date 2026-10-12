import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AVATARS, isAvatarKey, publishedAvatarKeys } from "@modules/accounts/domain/avatars";
import bannedTerms from "@modules/accounts/domain/catalog/avatarBannedTerms.json";
import es from "@shared/ui/i18n/locales/es.json";
import en from "@shared/ui/i18n/locales/en.json";

describe("catálogo de avatares (RF-26)", () => {
  it("doce avatares, con clave estable y sin repetidos", () => {
    expect(AVATARS).toHaveLength(12);
    for (const avatar of AVATARS) expect(avatar.key, avatar.key).toMatch(/^[a-z][a-zA-Z]+$/);
    expect(new Set(AVATARS.map((avatar) => avatar.key)).size).toBe(AVATARS.length);
  });

  it("las descripciones solo nombran rasgos visibles: nada de género, origen, religión, edad ni valoraciones", () => {
    for (const avatar of AVATARS) {
      const words = avatar.description.toLowerCase().split(/[^a-z]+/);
      for (const term of bannedTerms) expect(words, `${avatar.key}: "${term}"`).not.toContain(term);
    }
  });

  it("la lista de palabras prohibidas cubre los cinco grupos y frena un ejemplo de cada uno", () => {
    for (const term of ["woman", "african", "muslim", "elderly", "beautiful"]) expect(bannedTerms).toContain(term);
  });

  it("cada avatar tiene su texto alternativo en español y en inglés", () => {
    for (const avatar of AVATARS) {
      expect((es.avatares.descripciones as Record<string, string>)[avatar.key], `es: ${avatar.key}`).toBeTruthy();
      expect((en.avatares.descripciones as Record<string, string>)[avatar.key], `en: ${avatar.key}`).toBeTruthy();
    }
  });

  it("solo son elegibles los publicados, y cada publicado tiene su imagen revisada en public/avatars", () => {
    for (const key of publishedAvatarKeys()) {
      expect(isAvatarKey(key), key).toBe(true);
      expect(existsSync(`public/avatars/${key}.webp`), `falta public/avatars/${key}.webp`).toBe(true);
    }
    expect(isAvatarKey("no-existe")).toBe(false);
  });
});
