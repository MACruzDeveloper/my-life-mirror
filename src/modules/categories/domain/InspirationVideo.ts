/**
 * ADM-04 / RF-49: un vídeo de inspiración de la página de una categoría, en un
 * idioma. Lo añade administración (contenido curado: nunca el usuario ni la
 * IA). El título va tal como se publicó, en el idioma del vídeo.
 */
export interface InspirationVideo {
  readonly id: string;
  /** Clave estable de la categoría estándar (`deporte`, `aventura`…). */
  readonly categoryKey: string;
  /** El idioma del vídeo (`es`, `en`). */
  readonly locale: string;
  /** El identificador de 11 caracteres de YouTube; nunca un enlace. */
  readonly youtubeId: string;
  readonly title: string;
  readonly createdAt: Date;
}

export const MAX_VIDEO_TITLE_LENGTH = 120;
/** Por categoría e idioma: la página los enseña en filas de tres. */
export const MAX_VIDEOS_PER_PAGE = 6;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com"];

/**
 * El identificador de un vídeo de YouTube a partir de lo que pegue
 * administración: el identificador solo o un enlace habitual (`watch?v=`,
 * `youtu.be/`, `/shorts/`, `/embed/`). Solo de YouTube y con el formato exacto:
 * con él se construye la dirección del reproductor y de la miniatura.
 */
export function parseYoutubeId(input: string): string | undefined {
  const value = input.trim();
  if (YOUTUBE_ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
  if (!YOUTUBE_HOSTS.includes(url.hostname)) return undefined;
  const candidate = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : undefined;
}

/** Puerto — ADR-03 apartado 3.3. */
export interface InspirationVideoRepository {
  findAll(): Promise<InspirationVideo[]>;
  findByCategory(categoryKey: string): Promise<InspirationVideo[]>;
  findById(id: string): Promise<InspirationVideo | undefined>;
  save(video: InspirationVideo): Promise<void>;
  /** `false` si no existía. */
  delete(id: string): Promise<boolean>;
}
