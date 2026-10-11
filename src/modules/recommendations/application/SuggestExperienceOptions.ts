import { type Result, err, ok } from "#shared/domain/Result.js";
import { withTimeout } from "#shared/domain/withTimeout.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import { isSupportedLocale } from "#shared/domain/locales.js";
import type { ProfileRepository } from "#modules/accounts/domain/ProfileRepository.js";
import type { ExperienceRepository } from "#modules/assessments/domain/Experience.js";
import type { CategoryCatalogRepository } from "#modules/categories/domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { isExcludedFromAi } from "#modules/categories/domain/CatalogCategory.js";
import { experienceOptionsFor } from "#modules/categories/domain/experienceOptions.js";
import type { AiUsageLimiter } from "../domain/AiUsageLimiter.js";
import type { IdeaTexts } from "../domain/IdeaTexts.js";
import { situationOptionsFor } from "../domain/ideaSituations.js";
import type { OptionLabel, OptionSuggester, OptionSuggestion } from "../domain/OptionSuggester.js";
import { redactPersonalData } from "../domain/redactPersonalData.js";

interface Dependencies {
  experienceRepository: ExperienceRepository;
  categoryRepository: CategoryRepository;
  catalog: CategoryCatalogRepository;
  profileRepository: ProfileRepository;
  ideaTexts: IdeaTexts;
  /** Sin proveedor configurado la función está apagada: nunca hay sugerencias. */
  suggester?: OptionSuggester;
  timeoutMs?: number;
  /** Para registrar por qué no hubo sugerencias (lo inyecta el contenedor con el logger). */
  report?: (reason: string, error?: unknown) => void;
  /** RF-40b: tope diario por usuario con el proveedor real; sin él (el *Fake*), no se cuenta. */
  usageLimiter?: AiUsageLimiter;
}

const NONE: OptionSuggestion = { helps: [], difficulties: [] };


/** Empareja claves con sus textos (descarta las que no tienen texto en ese idioma). */
function labelled(keys: string[], labels: (keys: string[]) => string[]): OptionLabel[] {
  return keys.flatMap((key) => {
    const [label] = labels([key]);
    return label ? [{ key, label }] : [];
  });
}

/**
 * Caso de uso — RF-45 (ver la historia, Nivel 3, que manda sobre este código).
 * La IA solo traduce una experiencia a las listas cerradas de su categoría; no
 * escribe nada ni valora a la persona (RES-09). Cualquier duda o fallo acaba en
 * "sin sugerencias", nunca en un error para el usuario.
 */
export function createSuggestExperienceOptions(deps: Dependencies) {
  const { experienceRepository, categoryRepository, catalog, profileRepository, ideaTexts, suggester } = deps;
  const timeoutMs = deps.timeoutMs ?? 8000;
  const report = deps.report ?? (() => {});

  return async function suggestExperienceOptions(input: { userId: string; experienceId: string; locale: string }): Promise<Result<OptionSuggestion, NotFoundError | ValidationError>> {
    if (!isSupportedLocale(input.locale)) return err(new ValidationError("Locale is not supported"));
    const locale = input.locale;

    const experience = (await experienceRepository.findByUserId(input.userId)).find((candidate) => candidate.id === input.experienceId);
    if (!experience) return err(new NotFoundError("Experience not found"));

    if (!suggester) return ok(NONE);
    const profile = await profileRepository.findByUserId(input.userId);
    if (profile?.aiSuggestionsEnabled !== true) return ok(NONE);

    const category = await categoryRepository.findById(input.userId, experience.categoryId);
    if (!category) return ok(NONE);
    const catalogEntry = (await catalog.findAll()).find((entry) => entry.id === category.catalogId);
    const categoryKey = catalogEntry?.key;
    if (isExcludedFromAi(category.isSensitiveData, catalogEntry) || !categoryKey) return ok(NONE);

    // Las posibles: las de su categoría que aún no tiene marcadas.
    const helpKeys = experienceOptionsFor(categoryKey).filter((key) => !(category.experienceTags ?? []).includes(key));
    const difficultyKeys = situationOptionsFor(categoryKey).filter((key) => !(category.difficultyTags ?? []).includes(key));
    if (helpKeys.length === 0 && difficultyKeys.length === 0) return ok(NONE);

    try {
      if (deps.usageLimiter && !(await deps.usageLimiter.tryConsume(input.userId))) {
        report("tope diario de IA agotado");
        return ok(NONE);
      }
      const suggestion = await withTimeout(
        suggester.suggest({
          locale,
          categoryKey,
          text: redactPersonalData(experience.text),
          helps: labelled(helpKeys, (keys) => ideaTexts.experienceLabels(keys, locale)),
          difficulties: labelled(difficultyKeys, (keys) => ideaTexts.situationLabels(keys, locale)),
        }),
        timeoutMs,
      );
      // Salida cerrada: solo claves de las posibles, sin repetir; lo demás se descarta.
      const valid = (keys: unknown, allowed: string[]) => (Array.isArray(keys) ? [...new Set(keys.filter((key): key is string => typeof key === "string" && allowed.includes(key)))] : []);
      return ok({ helps: valid(suggestion?.helps, helpKeys), difficulties: valid(suggestion?.difficulties, difficultyKeys) });
    } catch (error) {
      report("proveedor de sugerencias", error);
      return ok(NONE);
    }
  };
}
