import type { InspirationVideo, InspirationVideoRepository } from "../domain/InspirationVideo.js";

/** Fake para tests — ADR-03 apartado 3.6. En desarrollo y producción, `SupabaseInspirationVideoRepository`. */
export class InMemoryInspirationVideoRepository implements InspirationVideoRepository {
  private readonly videos = new Map<string, InspirationVideo>();

  async findAll(): Promise<InspirationVideo[]> {
    return [...this.videos.values()];
  }

  async findByCategory(categoryKey: string): Promise<InspirationVideo[]> {
    return [...this.videos.values()].filter((video) => video.categoryKey === categoryKey);
  }

  async findById(id: string): Promise<InspirationVideo | undefined> {
    return this.videos.get(id);
  }

  async save(video: InspirationVideo): Promise<void> {
    this.videos.set(video.id, video);
  }

  async delete(id: string): Promise<boolean> {
    return this.videos.delete(id);
  }
}
