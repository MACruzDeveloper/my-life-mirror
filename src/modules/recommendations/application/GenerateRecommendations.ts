import { randomUUID } from "node:crypto";
import { type Result, ok } from "../../../shared/domain/Result.js";
import type { Clock } from "../../../shared/domain/Clock.js";
import type { Assessment } from "../../assessments/domain/Assessment.js";
import type { CategoryCatalogRepository } from "../../categories/domain/CategoryCatalogRepository.js";
import type { CategoryRepository } from "../../categories/domain/CategoryRepository.js";
import { type Recommendation, isOpen } from "../domain/Recommendation.js";
import type { RecommendationRepository } from "../domain/RecommendationRepository.js";
import { templateKeysFor } from "../domain/recommendationCatalog.js";

interface Dependencies {
  recommendationRepository: RecommendationRepository;
  categoryRepository: CategoryRepository;
  /** Para la clave estable de la categoría, de la que dependen sus plantillas. */
  catalog: CategoryCatalogRepository;
  clock: Clock;
  /** Se recomienda cuando la puntuación es menor que este valor (configurable, ver `parseThreshold`). */
  threshold: number;
}

/**
 * Caso de uso — RF-18. Recibe las evaluaciones recién guardadas y, por cada
 * categoría activa con puntuación por debajo del umbral, propone una acción
 * concreta del catálogo curado. Reglas: como mucho una recomendación abierta
 * por categoría (no acumular avisos, RES-07) y rotación de plantillas (una que
 * el usuario aún no haya recibido; si las agotó, se repite desde la primera).
 * Se invoca como oyente de `RecordAssessments`, después de persistir.
 * Ver docs/user-stories/RF-18-recomendaciones.md.
 */
export function createGenerateRecommendations({ recommendationRepository, categoryRepository, catalog, clock, threshold }: Dependencies) {
  return async function generateRecommendations(userId: string, assessments: Assessment[]): Promise<Result<Recommendation[], never>> {
    const existentes = await recommendationRepository.findByUserId(userId);
    const keysByCatalogId = new Map((await catalog.findAll()).map((entry) => [entry.id, entry.key]));
    const nuevas: Recommendation[] = [];

    for (const assessment of assessments) {
      if (assessment.score >= threshold) continue;

      const category = await categoryRepository.findById(userId, assessment.categoryId);
      if (!category || category.status !== "active") continue;

      const deLaCategoria = [...existentes, ...nuevas].filter((r) => r.categoryId === category.id);
      if (deLaCategoria.some(isOpen)) continue;

      const claves = templateKeysFor(category.catalogId ? keysByCatalogId.get(category.catalogId) : undefined);
      const usadas = new Set(deLaCategoria.map((r) => r.templateKey));
      const templateKey = claves.find((c) => !usadas.has(c)) ?? claves[0];

      nuevas.push({ id: randomUUID(), userId, categoryId: category.id, templateKey, threshold, status: "pending", createdAt: clock.now() });
    }

    await recommendationRepository.saveMany(nuevas);
    return ok(nuevas);
  };
}
