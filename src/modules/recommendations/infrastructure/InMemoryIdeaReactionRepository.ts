import type { IdeaReaction, IdeaReactionRepository } from "../domain/IdeaReaction.js";

const keyOf = (userId: string, categoryId: string, templateKey: string) => `${userId}|${categoryId}|${templateKey}`;

/** Fake solo para tests — ADR-03 apartado 3.6. En dev/producción: SupabaseIdeaReactionRepository. */
export class InMemoryIdeaReactionRepository implements IdeaReactionRepository {
  private readonly reactions = new Map<string, IdeaReaction>();

  async findByUserId(userId: string): Promise<IdeaReaction[]> {
    return [...this.reactions.values()].filter((reaction) => reaction.userId === userId);
  }

  async save(reaction: IdeaReaction): Promise<void> {
    this.reactions.set(keyOf(reaction.userId, reaction.categoryId, reaction.templateKey), reaction);
  }

  async delete(userId: string, categoryId: string, templateKey: string): Promise<void> {
    this.reactions.delete(keyOf(userId, categoryId, templateKey));
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [key, reaction] of this.reactions) {
      if (reaction.userId === userId) this.reactions.delete(key);
    }
  }
}
