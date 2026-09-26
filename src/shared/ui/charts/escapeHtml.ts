const HTML_ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * Los tooltips de ECharts se pintan como HTML. Cualquier texto que no controle
 * el código (p. ej. nombres de categoría, que puede crear el admin) debe pasar
 * por aquí antes de entrar en un tooltip, para que no se interprete como HTML.
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}
