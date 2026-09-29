import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Category, CategoryStatus, CategoryType } from "../domain/Category.js";
import type { CategoryRepository } from "../domain/CategoryRepository.js";

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  catalog_id: string | null;
  type: string;
  status: string;
  is_sensitive_data: boolean;
  experience_tags: string[] | null;
}

function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    ...(row.catalog_id ? { catalogId: row.catalog_id } : {}),
    type: row.type as CategoryType,
    status: row.status as CategoryStatus,
    isSensitiveData: row.is_sensitive_data,
    experienceTags: row.experience_tags ?? [],
  };
}

function rowFromCategory(category: Category): Omit<CategoryRow, never> {
  return {
    id: category.id,
    user_id: category.userId,
    name: category.name,
    description: category.description,
    catalog_id: category.catalogId ?? null,
    type: category.type,
    status: category.status,
    is_sensitive_data: category.isSensitiveData,
    experience_tags: [...(category.experienceTags ?? [])],
  };
}

/**
 * Adaptador real desde el principio — a diferencia de RF-03/RF-04, aquí no
 * se repite el error de empezar en memoria (ver supabase/migrations/0003_categories.sql
 * y 04_Almacenamiento_Datos.md apartado 5.1). Sin test propio: sin lógica más allá
 * de mapear filas ↔ Category, mismo criterio que el resto de adaptadores
 * Supabase de este proyecto.
 */
export class SupabaseCategoryRepository implements CategoryRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey);
  }

  async findByUserId(userId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from("categories")
      .select("id, user_id, catalog_id, name, description, type, status, is_sensitive_data, experience_tags")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`No se pudieron leer las categorías: ${error.message}`);
    }
    return (data as CategoryRow[]).map(categoryFromRow);
  }

  async findById(userId: string, categoryId: string): Promise<Category | undefined> {
    const { data, error } = await this.client
      .from("categories")
      .select("id, user_id, catalog_id, name, description, type, status, is_sensitive_data, experience_tags")
      .eq("user_id", userId)
      .eq("id", categoryId)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo leer la categoría: ${error.message}`);
    }
    if (!data) return undefined;
    return categoryFromRow(data as CategoryRow);
  }

  async save(category: Category): Promise<void> {
    const { error } = await this.client.from("categories").upsert(rowFromCategory(category));
    if (error) {
      throw new Error(`No se pudo guardar la categoría: ${error.message}`);
    }
  }

  async deactivateByCatalogId(catalogId: string): Promise<void> {
    const { error } = await this.client.from("categories").update({ status: "inactive" }).eq("catalog_id", catalogId);
    if (error) {
      throw new Error(`No se pudo desactivar la categoría: ${error.message}`);
    }
  }

  /**
   * Ignora los duplicados por (user_id, name): dos listados a la vez del
   * mismo usuario intentan sembrar lo mismo y no deben chocar (ListCategories
   * vuelve a leer después, así que da igual quién gane).
   */
  async saveMany(categories: Category[]): Promise<void> {
    if (categories.length === 0) return;
    const { error } = await this.client
      .from("categories")
      .upsert(categories.map(rowFromCategory), { onConflict: "user_id,name", ignoreDuplicates: true });
    if (error) {
      throw new Error(`No se pudieron guardar las categorías: ${error.message}`);
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.client.from("categories").delete().eq("user_id", userId);
    if (error) {
      throw new Error(`No se pudieron borrar las categorías: ${error.message}`);
    }
  }
}
