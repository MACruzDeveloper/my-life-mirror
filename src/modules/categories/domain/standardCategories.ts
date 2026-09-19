/**
 * RF-06: catálogo inicial, sembrado en la primera lista de cada usuario
 * (ver ListCategories). Sensibles (RNF-04/RES-04, categoría especial RGPD
 * Art. 9 — sexo/orientación, salud, religión): sexo, deporte, espiritualidad.
 */
export interface StandardCategoryTemplate {
  readonly name: string;
  readonly description: string;
  readonly isSensitiveData: boolean;
}

export const STANDARD_CATEGORIES: readonly StandardCategoryTemplate[] = [
  { name: "Economía", description: "Tus finanzas personales: ahorro, gasto, deudas.", isSensitiveData: false },
  { name: "Vida social", description: "Amistades y tiempo con otras personas.", isSensitiveData: false },
  { name: "Pareja", description: "Tu relación de pareja, si la tienes.", isSensitiveData: false },
  { name: "Sexo", description: "Tu vida sexual.", isSensitiveData: true },
  { name: "Deporte", description: "Actividad física y salud.", isSensitiveData: true },
  { name: "Aventura", description: "Nuevas experiencias, viajes, retos.", isSensitiveData: false },
  { name: "Espiritualidad", description: "Creencias, religión o práctica espiritual.", isSensitiveData: true },
  { name: "Familia", description: "Tu relación con tu familia.", isSensitiveData: false },
  { name: "Inversiones", description: "Inversión y planificación financiera a largo plazo.", isSensitiveData: false },
];
