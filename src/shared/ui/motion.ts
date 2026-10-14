/** `true` si la persona pide menos movimiento: entonces, sin desplazamientos suaves ni animaciones. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
