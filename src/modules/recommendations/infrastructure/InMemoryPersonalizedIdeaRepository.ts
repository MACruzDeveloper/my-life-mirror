import type { Locale } from "#shared/domain/locales.js";
import type { PersonalizedIdea, PersonalizedIdeaRepository } from "../domain/PersonalizedIdea.js";

/** Fake para tests — ADR-03 apartado 3.6. */
export class InMemoryPersonalizedIdeaRepository implements PersonalizedIdeaRepository {
  private readonly ideas = new Map<string, PersonalizedIdea>();

  async find(recommendationId: string, locale: Locale): Promise<PersonalizedIdea | undefined> {
    return this.ideas.get(`${recommendationId}:${locale}`);
  }

  async findByUserId(userId: string): Promise<PersonalizedIdea[]> {
    return [...this.ideas.values()].filter((idea) => idea.userId === userId);
  }

  async save(idea: PersonalizedIdea): Promise<void> {
    this.ideas.set(`${idea.recommendationId}:${idea.locale}`, idea);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [key, idea] of this.ideas) if (idea.userId === userId) this.ideas.delete(key);
  }
}
