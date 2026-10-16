import { describe, expect, it } from "vitest";
import videos from "@modules/categories/domain/catalog/inspirationVideos.json";
import { inspirationVideosFor } from "@modules/categories/domain/inspirationVideos";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import i18n from "@shared/ui/i18n";

// CAT-01: los vídeos de las páginas de categoría, como datos que elige el autor; estos tests avisan si se edita mal el JSON.
describe("catálogo de vídeos de inspiración (RF-49)", () => {
  it("claves únicas, de una categoría estándar, con su prefijo y un identificador de YouTube válido", () => {
    const keys = videos.map((video) => video.key);
    const standardKeys = new Set(STANDARD_CATEGORIES.map(({ key }) => key));
    expect(new Set(keys).size).toBe(keys.length);
    for (const video of videos) {
      expect(standardKeys.has(video.category), video.key).toBe(true);
      expect(video.key.startsWith(`${video.category}.`), video.key).toBe(true);
      expect(video.youtubeId, video.key).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(video.speaker.length, video.key).toBeGreaterThan(0);
    }
  });

  it("todo vídeo tiene título en español y en inglés", () => {
    const missing = videos.flatMap((video) => ["es", "en"].filter((language) => i18n.t(`videos.${video.key}`, { lng: language }) === `videos.${video.key}`).map((language) => `${language}:${video.key}`));
    expect(missing).toEqual([]);
  });

  it("Aventura y Deporte tienen tres cada una; una categoría sin vídeos, ninguno", () => {
    expect(inspirationVideosFor("aventura")).toHaveLength(3);
    expect(inspirationVideosFor("deporte")).toHaveLength(3);
    expect(inspirationVideosFor("economia")).toEqual([]);
  });
});
