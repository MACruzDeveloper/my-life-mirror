const PLACEHOLDER = "[…]";

/** En este orden: un email o un enlace pueden contener cifras que, si no, parecerían un teléfono. */
const PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, // emails
  /\b(?:https?:\/\/|www\.)\S+/gi, // enlaces
  // Teléfonos: 9 o más cifras (las españolas; las internacionales, con prefijo), con espacios, puntos,
  // guiones o +. Con 7 u 8 se llevaba fechas ("06-10-2026") y cantidades ("1.200.000").
  /\+?\d(?:[\s.-]?\d){8,}/g,
  /\b\d{6,}\b/g, // números largos (cuentas, documentos…)
];

/**
 * RF-45: quita del texto de una experiencia los datos personales que se pueden
 * reconocer con seguridad antes de enviarlo a la IA (minimización). Los nombres
 * propios no se tocan: no se distinguen con fiabilidad (¿"Rosa" es una persona o
 * un color?), así que la interfaz avisa al usuario en lugar de prometerlo.
 */
export function redactPersonalData(text: string): string {
  return PATTERNS.reduce((current, pattern) => current.replace(pattern, PLACEHOLDER), text);
}
