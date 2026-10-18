import type { Locale } from "#shared/domain/locales.js";
import type { CategoryText } from "./CatalogCategory.js";

/**
 * RF-06: catálogo inicial. La fuente real es la base de datos
 * (`category_catalog` + `category_translations`, migraciones 0005 y 0009, que
 * repiten estos textos); esta lista alimenta el fake en memoria de los tests y
 * documenta la semilla. Sensibles (RNF-04/RES-04, categoría especial RGPD
 * Art. 9 — sexo/orientación, religión, salud): sexo, espiritualidad y salud. Deporte lo fue
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
      // "Finanzas" desde el 18 oct. 2026 (antes "Economía"): incluye la inversión, que deja de ser una categoría aparte. La clave sigue siendo `economia`.
      es: { name: "Finanzas", description: "Tus finanzas: ahorro, gasto, deudas e inversión a largo plazo." },
      en: { name: "Finances", description: "Your finances: savings, spending, debts and long-term investing." },
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
    // Añadida el 12 oct. 2026, tras la segunda prueba con una usuaria. Sensible (salud es categoría
    // especial del RGPD): pide consentimiento y queda fuera de la IA y de las experiencias compartidas.
    key: "salud",
    isSensitiveData: true,
    translations: {
      es: { name: "Salud", description: "Cómo te encuentras: descanso, energía y cuidado de ti." },
      en: { name: "Health", description: "How you feel: rest, energy and looking after yourself." },
    },
  },
  {
    // Añadida el 16 oct. 2026, pedida por el autor: la relación con la tecnología (pantallas,
    // desconexión, aprender herramientas). No sensible: no pide datos de categorías especiales.
    key: "tecnologia",
    isSensitiveData: false,
    translations: {
      es: { name: "Tecnología", description: "Tu relación con la tecnología: pantallas, desconexión y lo que aprendes." },
      en: { name: "Technology", description: "Your relationship with technology: screens, switching off and what you learn." },
    },
  },
  {
    // Añadida el 18 oct. 2026, pedida por el autor: estudios, cursos e idiomas (Idiomas, creada desde
    // el panel, pasa a ser esta: migración 0034).
    key: "formacion",
    isSensitiveData: false,
    translations: {
      es: { name: "Formación", description: "Lo que aprendes: estudios, cursos, idiomas y habilidades nuevas." },
      en: { name: "Learning", description: "What you learn: studies, courses, languages and new skills." },
    },
  },
  {
    // Añadida el 18 oct. 2026, pedida por el autor. No sensible.
    key: "voluntariado",
    isSensitiveData: false,
    translations: {
      es: { name: "Voluntariado", description: "El tiempo que dedicas a ayudar a otras personas, a los animales o a tu entorno." },
      en: { name: "Volunteering", description: "The time you give to help other people, animals or your surroundings." },
    },
  },
];

/**
 * Categorías estándar retiradas (ADM-02): ya no se ofrecen ni se puntúan, pero sus ideas, opciones y
 * textos se conservan para el historial de quien las usó. Inversiones, retirada el 18 oct. 2026: pasa
 * a formar parte de Finanzas (`economia`).
 */
export const RETIRED_CATEGORY_KEYS = ["inversiones"] as const;
