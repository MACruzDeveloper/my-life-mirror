import es from "#shared/ui/i18n/locales/es.json" with { type: "json" };
import en from "#shared/ui/i18n/locales/en.json" with { type: "json" };
import type { Locale } from "#shared/domain/locales.js";
import type { IdeaCandidate } from "../domain/IdeaWriter.js";
import type { IdeaTexts } from "../domain/IdeaTexts.js";
import { templateKeysFor } from "#modules/recommendations/domain/recommendationCatalog.js";

type Tree = { [key: string]: string | Tree };
const RESOURCES: Record<Locale, Tree> = { es: es as unknown as Tree, en: en as unknown as Tree };

function lookup(tree: Tree, path: string): string | undefined {
  const value = path.split(".").reduce<string | Tree | undefined>((node, part) => (typeof node === "object" ? node[part] : undefined), tree);
  return typeof value === "string" ? value : undefined;
}

/**
 * RF-40. Los textos curados viven en las traducciones de la interfaz
 * (`recomendaciones.plantillas.*`, `experiencias.*`); el servidor los lee de
 * esos mismos archivos para no duplicarlos. `check:api` comprueba que la
 * importación de JSON carga en Vercel.
 */
export class JsonIdeaTexts implements IdeaTexts {
  candidatesFor(categoryKey: string, locale: Locale): IdeaCandidate[] {
    const keys = templateKeysFor(categoryKey);
    if (!keys.every((key) => key.startsWith(`${categoryKey}.`))) return []; // solo ideas propias, no las generales
    return keys.flatMap((templateKey) => {
      const text = lookup(RESOURCES[locale], `recomendaciones.plantillas.${templateKey}`);
      return text ? [{ templateKey, text }] : [];
    });
  }

  situationLabels(keys: readonly string[], locale: Locale): string[] {
    return keys.flatMap((key) => {
      const label = lookup(RESOURCES[locale], `situaciones.${key}`);
      return label ? [label] : [];
    });
  }

  profileLabels(profile: { occupation?: string; hobbies?: readonly string[] }, locale: Locale): { occupation?: string; hobbies: string[] } {
    const occupation = profile.occupation ? lookup(RESOURCES[locale], `perfil.ocupaciones.${profile.occupation}`) : undefined;
    const hobbies = (profile.hobbies ?? []).flatMap((hobby) => {
      const label = lookup(RESOURCES[locale], `perfil.aficiones.${hobby}`);
      return label ? [label] : [];
    });
    return { ...(occupation ? { occupation } : {}), hobbies };
  }

  experienceLabels(tags: readonly string[], locale: Locale): string[] {
    return tags.flatMap((tag) => {
      const label = lookup(RESOURCES[locale], `experiencias.${tag}`);
      return label ? [label] : [];
    });
  }
}
