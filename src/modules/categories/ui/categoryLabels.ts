import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

/**
 * RNF-10. Los nombres y descripciones de las categorías vienen de la base de
 * datos, en español. Las 9 estándar (ver `standardCategories.ts` y la
 * migración 0005) se traducen en la interfaz con estas claves; las que crea
 * el admin (ADM-02) no tienen traducción y se muestran tal cual.
 *
 * Se traduce **solo al mostrar**: la lógica (ejemplos de la entrevista,
 * plantillas de recomendación...) sigue identificando cada categoría por su
 * nombre guardado.
 */
const STANDARD_CATEGORY_KEYS: Record<string, string> = {
  Economía: "economia",
  "Vida social": "vidaSocial",
  Pareja: "pareja",
  Sexo: "sexo",
  Deporte: "deporte",
  Aventura: "aventura",
  Espiritualidad: "espiritualidad",
  Familia: "familia",
  Inversiones: "inversiones",
};

/** Clave de i18n de una categoría estándar (`undefined` si la creó el admin). */
export function standardCategoryKey(storedName: string): string | undefined {
  return STANDARD_CATEGORY_KEYS[storedName];
}

export function translateCategoryName(storedName: string, t: TFunction): string {
  const key = standardCategoryKey(storedName);
  return key ? t(`categoriasEstandar.${key}.nombre`) : storedName;
}

export function translateCategoryDescription(storedName: string, storedDescription: string, t: TFunction): string {
  const key = standardCategoryKey(storedName);
  return key ? t(`categoriasEstandar.${key}.descripcion`) : storedDescription;
}

/** Atajo para componentes: nombre y descripción de una categoría en el idioma actual. */
export function useCategoryLabels() {
  const { t } = useTranslation();
  return {
    name: (storedName: string) => translateCategoryName(storedName, t),
    description: (storedName: string, storedDescription: string) => translateCategoryDescription(storedName, storedDescription, t),
  };
}
