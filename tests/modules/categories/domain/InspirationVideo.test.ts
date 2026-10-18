import { describe, expect, it } from "vitest";
import { parseYoutubeId } from "@modules/categories/domain/InspirationVideo";

describe("parseYoutubeId (ADM-04)", () => {
  it("acepta el identificador o los enlaces habituales de YouTube, y se queda con el identificador", () => {
    for (const input of [
      "BHY0FxzoKZE",
      " BHY0FxzoKZE ",
      "https://www.youtube.com/watch?v=BHY0FxzoKZE",
      "https://www.youtube.com/watch?v=BHY0FxzoKZE&t=42s",
      "https://youtube.com/watch?feature=share&v=BHY0FxzoKZE",
      "https://m.youtube.com/watch?v=BHY0FxzoKZE",
      "https://youtu.be/BHY0FxzoKZE?si=abc",
      "https://www.youtube.com/shorts/BHY0FxzoKZE",
      "https://www.youtube.com/embed/BHY0FxzoKZE",
      "https://www.youtube-nocookie.com/embed/BHY0FxzoKZE",
    ]) {
      expect(parseYoutubeId(input), input).toBe("BHY0FxzoKZE");
    }
    expect(parseYoutubeId("-vZXgApsPCQ")).toBe("-vZXgApsPCQ");
  });

  it("rechaza lo que no es de YouTube o no tiene un identificador válido", () => {
    for (const input of ["", "corto", "BHY0FxzoKZE1", "https://vimeo.com/123456789", "https://evil.example/watch?v=BHY0FxzoKZE", "https://www.youtube.com/watch?v=<script>", "javascript:alert(1)", "https://youtu.be/"]) {
      expect(parseYoutubeId(input), input).toBeUndefined();
    }
  });
});
