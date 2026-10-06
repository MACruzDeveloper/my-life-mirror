const PLACEHOLDER = "[…]";

/** En este orden: un email o un enlace pueden contener cifras que, si no, parecerían un teléfono. */
const PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, // emails
  /\b(?:https?:\/\/|www\.)\S+/gi, // enlaces
  /\+?\d(?:[\s.-]?\d){6,}/g, // teléfonos: 7 o más cifras, con espacios, puntos, guiones o prefijo +
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
