import type { Locale } from "#shared/domain/locales.js";
import type { CategoryText } from "./CatalogCategory.js";

/**
 * RF-06: catálogo inicial. La fuente real es la base de datos
 * (`category_catalog` + `category_translations`, migraciones 0005 y 0009, que
 * repiten estos textos); esta lista alimenta el fake en memoria de los tests y
 * documenta la semilla. Sensibles (RNF-04/RES-04, categoría especial RGPD
 * Art. 9 — sexo/orientación, religión): sexo y espiritualidad. Deporte lo fue
 * hasta el 6 oct. 2026 (migración 0018): habla de actividad física, no pide datos
 * de salud, y cualquier área puede tocar algo personal (decisión del autor).
 *
 * `key` es un identificador estable (no cambia aunque cambie el texto): lo usan
 * los ejemplos de la entrevista y las plantillas de recomendación.
 */
export interface StandardCategoryTemplate {
  readonly key: string;
  readonly isSensitiveData: boolean;
  /** RF-45: fuera de la IA sin ser sensible (ver `CatalogCategory.aiExcluded`). */
  readonly aiExcluded?: boolean;
  /** Obligatorio en cada idioma soportado: el compilador avisa si se añade uno sin traducir. */
  readonly translations: Record<Locale, CategoryText>;
}

export const STANDARD_CATEGORIES: readonly StandardCategoryTemplate[] = [
  {
    key: "economia",
    isSensitiveData: false,
    translations: {
      es: { name: "Economía", description: "Tus finanzas personales: ahorro, gasto, deudas." },
      en: { name: "Finances", description: "Your personal finances: savings, spending, debts." },
    },
  },
  {
    key: "vidaSocial",
    isSensitiveData: false,
    translations: {
      es: { name: "Vida social", description: "Amistades y tiempo con otras personas." },
      en: { name: "Social life", description: "Friendships and time with other people." },
    },
  },
  {
    key: "pareja",
    isSensitiveData: false,
    aiExcluded: true,
    translations: {
      es: { name: "Pareja", description: "Tu relación de pareja, si la tienes." },
      en: { name: "Relationship", description: "Your relationship with your partner, if you have one." },
    },
  },
  {
    key: "sexo",
    isSensitiveData: true,
    translations: {
      es: { name: "Sexo", description: "Tu vida sexual." },
      en: { name: "Sex", description: "Your sex life." },
    },
  },
  {
    key: "deporte",
    isSensitiveData: false,
    translations: {
      es: { name: "Deporte", description: "Actividad física y movimiento." },
      en: { name: "Sport", description: "Physical activity and movement." },
    },
  },
  {
    key: "aventura",
    isSensitiveData: false,
    translations: {
      es: { name: "Aventura", description: "Nuevas experiencias, viajes, retos." },
      en: { name: "Adventure", description: "New experiences, travel, challenges." },
    },
  },
  {
    key: "espiritualidad",
    isSensitiveData: true,
    translations: {
      es: { name: "Espiritualidad", description: "Creencias, religión o práctica espiritual." },
      en: { name: "Spirituality", description: "Beliefs, religion or spiritual practice." },
    },
  },
  {
    key: "familia",
    isSensitiveData: false,
    translations: {
      es: { name: "Familia", description: "Tu relación con tu familia." },
      en: { name: "Family", description: "Your relationship with your family." },
    },
  },
  {
    key: "inversiones",
    isSensitiveData: false,
    translations: {
      es: { name: "Inversiones", description: "Inversión y planificación financiera a largo plazo." },
      en: { name: "Investments", description: "Investing and long-term financial planning." },
    },
  },
];
