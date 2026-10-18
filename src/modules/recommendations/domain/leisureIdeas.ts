import ideas from "./catalog/leisureIdeas.json" with { type: "json" };

/**
 * RF-50: ideas para disfrutar y descansar cuando a la persona le va bien en
 * todo. Contenido curado (RD-09, CAT-01): las claves aquí, los textos en las
 * traducciones (`recomendaciones.ocio.ideas.<n>`). Ninguna es consejo de salud
 * (RES-05); una de ellas es tomarse un descanso de la propia app.
 */
export const LEISURE_IDEAS: readonly string[] = ideas.map((idea) => idea.key);

/** La banda alta de las puntuaciones (como en Resultados): de 8 a 10. */
const HIGH_SCORE = 8;
/** Con menos categorías, "todo va bien" diría poco. */
const MIN_CATEGORIES = 3;

/**
 * Todo va bien: al menos tres categorías activas, todas puntuadas y todas en la
 * banda alta. Una sin puntuar cuenta como "no se sabe": entonces no se dice.
 */
export function isBalanced(scores: readonly (number | undefined)[]): boolean {
  return scores.length >= MIN_CATEGORIES && scores.every((score) => score !== undefined && score >= HIGH_SCORE);
}
