import { describe, expect, it } from "vitest";
import { createAddInspirationVideo, createDeleteInspirationVideo, createListAllInspirationVideos, createListInspirationVideos, createUpdateInspirationVideo } from "@modules/categories/application/InspirationVideos";
import { MAX_VIDEOS_PER_PAGE } from "@modules/categories/domain/InspirationVideo";
import { InMemoryInspirationVideoRepository } from "@modules/categories/infrastructure/InMemoryInspirationVideoRepository";

const ADMIN = { rol: "admin" };
const USER = { rol: "usuario" };
const video = (overrides: Record<string, string> = {}) => ({ categoryKey: "deporte", locale: "es", youtubeUrl: "https://youtu.be/BHY0FxzoKZE", title: "Los beneficios del ejercicio", ...overrides });

function setup() {
  const repository = new InMemoryInspirationVideoRepository();
  const clock = { now: () => new Date("2026-10-17T10:00:00Z") };
  return {
    add: createAddInspirationVideo({ repository, clock }),
    remove: createDeleteInspirationVideo(repository),
    update: createUpdateInspirationVideo(repository),
    listAll: createListAllInspirationVideos(repository),
    list: createListInspirationVideos(repository),
  };
}

describe("vídeos de inspiración desde administración (ADM-04)", () => {
  it("un admin añade un vídeo con el enlace de YouTube; se guarda el identificador, con espacios recortados", async () => {
    const { add, listAll } = setup();

    const added = await add(ADMIN, video({ title: "  Los beneficios del ejercicio " }));

    expect(added.ok && added.value).toEqual({ id: expect.any(String), categoryKey: "deporte", locale: "es", youtubeId: "BHY0FxzoKZE", title: "Los beneficios del ejercicio" });
    const all = await listAll(ADMIN);
    expect(all.ok && all.value).toHaveLength(1);
  });

  it("solo administración puede listar, añadir o quitar", async () => {
    const { add, remove, listAll } = setup();

    expect((await add(USER, video())).ok).toBe(false);
    expect((await listAll(USER)).ok).toBe(false);
    const added = await add(ADMIN, video());
    expect((await remove(USER, added.ok ? added.value.id : "")).ok).toBe(false);
  });

  it("rechaza una categoría que no existe, un idioma no soportado, un enlace que no es de YouTube o textos vacíos o largos", async () => {
    const { add } = setup();

    for (const input of [
      video({ categoryKey: "inventada" }),
      video({ locale: "fr" }),
      video({ youtubeUrl: "https://vimeo.com/1" }),
      video({ title: "  " }),
      video({ title: "x".repeat(121) }),
    ]) {
      expect((await add(ADMIN, input)).ok, JSON.stringify(input)).toBe(false);
    }
  });

  it("el mismo vídeo no se repite en la misma categoría e idioma (sí en otro idioma), y hay un tope por página", async () => {
    const { add } = setup();
    await add(ADMIN, video());

    const repeated = await add(ADMIN, video({ youtubeUrl: "BHY0FxzoKZE" }));
    expect(!repeated.ok && repeated.error.code).toBe("CONFLICT");
    expect((await add(ADMIN, video({ locale: "en" }))).ok).toBe(true);

    for (let index = 1; index < MAX_VIDEOS_PER_PAGE; index++) await add(ADMIN, video({ youtubeUrl: `AAAAAAAAAA${index}` }));
    expect((await add(ADMIN, video({ youtubeUrl: "ZZZZZZZZZZZ" }))).ok).toBe(false);
  });

  it("la página enseña los del idioma de la interfaz; si no hay ninguno, los de otro idioma; en el orden en que se añadieron", async () => {
    const { add, list } = setup();
    await add(ADMIN, video({ youtubeUrl: "AAAAAAAAAAA", title: "Primero" }));
    await add(ADMIN, video({ youtubeUrl: "BBBBBBBBBBB", title: "Segundo" }));
    await add(ADMIN, video({ categoryKey: "aventura", locale: "en", youtubeUrl: "CCCCCCCCCCC", title: "Third" }));

    const sport = await list({ categoryKey: "deporte", locale: "es" });
    expect(sport.ok && sport.value.map((item) => item.title)).toEqual(["Primero", "Segundo"]);
    const adventure = await list({ categoryKey: "aventura", locale: "es" });
    expect(adventure.ok && adventure.value.map((item) => ({ title: item.title, locale: item.locale }))).toEqual([{ title: "Third", locale: "en" }]);
    const none = await list({ categoryKey: "economia", locale: "es" });
    expect(none.ok && none.value).toEqual([]);
  });

  it("quitar un vídeo lo quita de la página; uno que no existe, 404", async () => {
    const { add, remove, list } = setup();
    const added = await add(ADMIN, video());

    expect((await remove(ADMIN, added.ok ? added.value.id : "")).ok).toBe(true);
    const listed = await list({ categoryKey: "deporte", locale: "es" });
    expect(listed.ok && listed.value).toEqual([]);
    const missing = await remove(ADMIN, "no-existe");
    expect(!missing.ok && missing.error.code).toBe("NOT_FOUND");
  });

  it("un admin edita un vídeo (categoría, idioma, enlace y título), con las mismas reglas; sin rol, no", async () => {
    const { add, update, list } = setup();
    const first = await add(ADMIN, video());
    await add(ADMIN, video({ youtubeUrl: "AAAAAAAAAAA", title: "Otro" }));
    const id = first.ok ? first.value.id : "";

    const edited = await update(ADMIN, id, video({ locale: "en", youtubeUrl: "https://www.youtube.com/watch?v=CCCCCCCCCCC", title: "Edited" }));
    expect(edited.ok && edited.value).toMatchObject({ id, locale: "en", youtubeId: "CCCCCCCCCCC", title: "Edited" });
    const english = await list({ categoryKey: "deporte", locale: "en" });
    expect(english.ok && english.value.map((item) => item.title)).toEqual(["Edited"]);

    // Volver a ponerlo igual que otro de la misma página choca; dejarse a sí mismo igual, no.
    const clash = await update(ADMIN, id, video({ youtubeUrl: "AAAAAAAAAAA" }));
    expect(!clash.ok && clash.error.code).toBe("CONFLICT");
    expect((await update(ADMIN, id, video({ locale: "en", youtubeUrl: "CCCCCCCCCCC", title: "Edited again" }))).ok).toBe(true);
    expect((await update(ADMIN, id, video({ youtubeUrl: "https://vimeo.com/1" }))).ok).toBe(false);
    expect((await update(USER, id, video())).ok).toBe(false);
    const missing = await update(ADMIN, "no-existe", video());
    expect(!missing.ok && missing.error.code).toBe("NOT_FOUND");
  });
});
