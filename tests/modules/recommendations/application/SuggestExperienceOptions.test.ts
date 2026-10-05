import { describe, expect, it } from "vitest";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";
import { InMemoryExperienceRepository } from "@modules/assessments/infrastructure/InMemoryExperienceRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { createSuggestExperienceOptions } from "@modules/recommendations/application/SuggestExperienceOptions";
import type { OptionSuggester, OptionSuggestion, SuggestOptionsRequest } from "@modules/recommendations/domain/OptionSuggester";
import { FakeOptionSuggester } from "@modules/recommendations/infrastructure/FakeOptionSuggester";
import { JsonIdeaTexts } from "@modules/recommendations/infrastructure/JsonIdeaTexts";

/** Proveedor de prueba: guarda la petición y devuelve lo que se le diga. */
class ScriptedSuggester implements OptionSuggester {
  calls: SuggestOptionsRequest[] = [];
  private readonly answer: (request: SuggestOptionsRequest) => Promise<OptionSuggestion>;
  constructor(answer: (request: SuggestOptionsRequest) => Promise<OptionSuggestion>) {
    this.answer = answer;
  }
  async suggest(request: SuggestOptionsRequest): Promise<OptionSuggestion> {
    this.calls.push(request);
    return this.answer(request);
  }
}

async function setup(options: { suggester?: OptionSuggester | null; enabled?: boolean; experienceText?: string } = {}) {
  const categoryRepository = new InMemoryCategoryRepository();
  const catalog = new InMemoryCategoryCatalogRepository();
  const listed = await createListCategories(categoryRepository, catalog)("u1");
  if (!listed.ok) throw new Error("setup");
  const entries = await catalog.findAll();
  const byKey = (key: string) => listed.value.find((c) => c.catalogId === entries.find((e) => e.key === key)?.id)!;
  const social = byKey("vidaSocial");
  const sport = byKey("deporte");
  const couple = byKey("pareja");
  await categoryRepository.save({ ...couple, status: "active" });
  await categoryRepository.save({ ...social, status: "active", experienceTags: ["vidaSocial.planesTranquilos"] });
  await categoryRepository.save({ ...sport, status: "active" });

  const profileRepository = new InMemoryProfileRepository();
  await profileRepository.save({ userId: "u1", name: "Ana", aiSuggestionsEnabled: options.enabled ?? true });
  const experienceRepository = new InMemoryExperienceRepository();
  await experienceRepository.save({ id: "e-social", userId: "u1", categoryId: social.id, text: options.experienceText ?? "Me agobian los sitios con mucha gente; prefiero planes tranquilos. Escríbeme a ana@correo.es", createdAt: new Date() });
  await experienceRepository.save({ id: "e-sport", userId: "u1", categoryId: sport.id, text: "Me cuesta salir a correr", createdAt: new Date() });
  await experienceRepository.save({ id: "e-couple", userId: "u1", categoryId: couple.id, text: "Nos cuesta hablar las cosas", createdAt: new Date() });

  const suggester = options.suggester === null ? undefined : (options.suggester ?? new FakeOptionSuggester());
  const suggest = createSuggestExperienceOptions({ experienceRepository, categoryRepository, catalog, profileRepository, ideaTexts: new JsonIdeaTexts(), suggester, timeoutMs: 50 });
  return { suggest };
}

const empty = { helps: [], difficulties: [] };

describe("SuggestExperienceOptions (RF-45)", () => {
  it("con todo activado, devuelve opciones de las listas de esa categoría (el Fake, por palabras clave)", async () => {
    const { suggest } = await setup();

    const result = await suggest({ userId: "u1", experienceId: "e-social", locale: "es" });

    expect(result).toEqual({ ok: true, value: { helps: [], difficulties: ["sitiosConGente"] } });
  });

  it("a la IA le llega el texto sin datos personales, la clave y las opciones posibles sin las ya marcadas; nunca ids ni el nombre", async () => {
    const suggester = new ScriptedSuggester(async () => empty);
    const { suggest } = await setup({ suggester });

    await suggest({ userId: "u1", experienceId: "e-social", locale: "es" });

    const [request] = suggester.calls;
    expect(request.text).toBe("Me agobian los sitios con mucha gente; prefiero planes tranquilos. Escríbeme a […]");
    expect(request.categoryKey).toBe("vidaSocial");
    expect(request.helps.map((option) => option.key)).not.toContain("vidaSocial.planesTranquilos");
    expect(request.helps).toContainEqual({ key: "vidaSocial.quedarEnPersona", label: "Quedar en persona" });
    expect(request.difficulties).toContainEqual({ key: "sitiosConGente", label: "Sitios con mucha gente" });
    expect(JSON.stringify(request)).not.toMatch(/e-social|u1|Ana|ana@correo/);
  });

  it("solo deja claves válidas de esa categoría, sin repetir ni las ya marcadas", async () => {
    const suggester = new ScriptedSuggester(async () => ({
      helps: ["vidaSocial.quedarEnPersona", "vidaSocial.quedarEnPersona", "vidaSocial.planesTranquilos", "deporte.caminar", "inventada"],
      difficulties: ["sitiosConGente", "mirarMisCuentas"],
    }));
    const { suggest } = await setup({ suggester });

    const result = await suggest({ userId: "u1", experienceId: "e-social", locale: "es" });

    expect(result).toEqual({ ok: true, value: { helps: ["vidaSocial.quedarEnPersona"], difficulties: ["sitiosConGente"] } });
  });

  const emptyCases: [string, Parameters<typeof setup>[0], string][] = [
    ["el usuario no lo ha activado", { enabled: false }, "e-social"],
    ["no hay proveedor", { suggester: null }, "e-social"],
    ["la categoría es sensible (Deporte)", {}, "e-sport"],
    ["la categoría está excluida de la IA (Pareja)", {}, "e-couple"],
    ["el proveedor falla", { suggester: new ScriptedSuggester(async () => Promise.reject(new Error("caído"))) }, "e-social"],
    ["el proveedor tarda demasiado", { suggester: new ScriptedSuggester(() => new Promise((resolve) => setTimeout(() => resolve({ helps: ["vidaSocial.quedarEnPersona"], difficulties: [] }), 500))) }, "e-social"],
  ];
  for (const [name, options, experienceId] of emptyCases) {
    it(`sin sugerencias (y sin error) si ${name}`, async () => {
      const { suggest } = await setup(options);

      expect(await suggest({ userId: "u1", experienceId, locale: "es" })).toEqual({ ok: true, value: empty });
    });
  }

  it("sin activar, ni siquiera se llama al proveedor", async () => {
    const suggester = new ScriptedSuggester(async () => empty);
    const { suggest } = await setup({ suggester, enabled: false });

    await suggest({ userId: "u1", experienceId: "e-social", locale: "es" });

    expect(suggester.calls).toHaveLength(0);
  });

  it("una experiencia de otro usuario no existe para este; un idioma no soportado se rechaza", async () => {
    const { suggest } = await setup();

    const notFound = await suggest({ userId: "otro", experienceId: "e-social", locale: "es" });
    const badLocale = await suggest({ userId: "u1", experienceId: "e-social", locale: "fr" });

    expect(!notFound.ok && notFound.error.code).toBe("NOT_FOUND");
    expect(!badLocale.ok && badLocale.error.code).toBe("VALIDATION_ERROR");
  });
});
