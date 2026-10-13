import { type Result, err, ok } from "#shared/domain/Result.js";
import type { Clock } from "#shared/domain/Clock.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import type { CategoryCatalogRepository } from "#modules/categories/domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { IDEA_REACTIONS, type IdeaReaction, type IdeaReactionKind, type IdeaReactionRepository } from "../domain/IdeaReaction.js";
import { templateKeysFor } from "../domain/recommendationCatalog.js";

export interface SetIdeaReactionInput {
  userId: string;
  categoryId: string;
  templateKey: string;
  /** `null` quita la reacción (dejar de guardar, o recuperar una descartada). */
  reaction: IdeaReactionKind | null;
}

/** Lo que ve la interfaz: sin el usuario, que ya se sabe. */
export type IdeaReactionView = Omit<IdeaReaction, "userId">;

interface SetIdeaReactionDependencies {
  ideaReactionRepository: IdeaReactionRepository;
  categoryRepository: CategoryRepository;
  catalog: CategoryCatalogRepository;
  clock: Clock;
}

/**
 * Caso de uso — RF-19: guardar una idea, darla por hecha o descartarla; o
 * quitar esa reacción. Solo sobre una categoría propia, y solo con ideas del
 * catálogo que correspondan a esa categoría (las suyas o, si no tiene, las
 * generales): la clave llega del navegador y no se guarda nada que no exista.
 */
export function createSetIdeaReaction({ ideaReactionRepository, categoryRepository, catalog, clock }: SetIdeaReactionDependencies) {
  return async function setIdeaReaction(input: SetIdeaReactionInput): Promise<Result<void, NotFoundError | ValidationError>> {
    const userId = input.userId.trim();
    const category = await categoryRepository.findById(userId, input.categoryId.trim());
    if (!category) return err(new NotFoundError("Category not found"));

    const catalogEntry = (await catalog.findAll()).find((entry) => entry.id === category.catalogId);
    const templateKey = input.templateKey.trim();
    if (!templateKeysFor(catalogEntry?.key).includes(templateKey)) return err(new ValidationError("Idea does not belong to this category"));

    if (input.reaction === null) {
      await ideaReactionRepository.delete(userId, category.id, templateKey);
      return ok(undefined);
    }
    if (!(IDEA_REACTIONS as readonly string[]).includes(input.reaction)) return err(new ValidationError("Reaction is not valid"));

    await ideaReactionRepository.save({ userId, categoryId: category.id, templateKey, reaction: input.reaction, reactedAt: clock.now() });
    return ok(undefined);
  };
}

/** Caso de uso — RF-19: las reacciones del usuario, la más reciente primero. */
export function createListIdeaReactions(ideaReactionRepository: IdeaReactionRepository) {
  return async function listIdeaReactions(userId: string): Promise<Result<IdeaReactionView[], never>> {
    const reactions = await ideaReactionRepository.findByUserId(userId.trim());
    return ok(
      [...reactions]
        .sort((a, b) => b.reactedAt.getTime() - a.reactedAt.getTime())
        .map(({ categoryId, templateKey, reaction, reactedAt }) => ({ categoryId, templateKey, reaction, reactedAt })),
    );
  };
}
