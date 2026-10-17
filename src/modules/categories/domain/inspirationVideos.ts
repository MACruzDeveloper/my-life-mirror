import videos from "./catalog/inspirationVideos.json" with { type: "json" };

/**
 * RF-49: vídeos de inspiración de las páginas de categoría. Contenido curado
 * como datos (CAT-01): los elige el autor, nunca el usuario ni la IA. El título
 * de cada uno, en las traducciones (`videos.<clave>`); el nombre de quien habla
 * no se traduce. Se reproducen desde YouTube sin cookies (`youtube-nocookie.com`).
 */
export interface InspirationVideo {
  readonly key: string;
  readonly category: string;
  /** El identificador de 11 caracteres de YouTube. */
  readonly youtubeId: string;
  readonly speaker: string;
}

export function inspirationVideosFor(categoryKey: string): readonly InspirationVideo[] {
  return videos.filter((video) => video.category === categoryKey);
}
