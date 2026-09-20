import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Category, CategoryStatus, CategoryType } from "../domain/Category";
import type { CategoryRepository } from "../domain/CategoryRepository";

interface FilaCategoria {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  is_sensitive_data: boolean;
}

function categoriaDesdeFila(fila: FilaCategoria): Category {
  return {
    id: fila.id,
    userId: fila.user_id,
    name: fila.name,
    description: fila.description,
    type: fila.type as CategoryType,
    status: fila.status as CategoryStatus,
    isSensitiveData: fila.is_sensitive_data,
  };
}

function filaDesdeCategoria(category: Category): Omit<FilaCategoria, never> {
  return {
    id: category.id,
    user_id: category.userId,
    name: category.name,
    description: category.description,
    type: category.type,
    status: category.status,
    is_sensitive_data: category.isSensitiveData,
  };
}

/**
 * Adaptador real desde el principio — a diferencia de RF-03/RF-04, aquí no
 * se repite el error de empezar en memoria (ver supabase/migrations/0003_categories.sql
 * y 04_Almacenamiento_Datos.md §7bis). Sin test propio: sin lógica más allá
 * de mapear filas ↔ Category, mismo criterio que el resto de adaptadores
 * Supabase de este proyecto.
 */
export class SupabaseCategoryRepository implements CategoryRepository {
  private readonly cliente: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.cliente = createClient(url, serviceRoleKey);
  }

  async findByUserId(userId: string): Promise<Category[]> {
    const { data, error } = await this.cliente
      .from("categories")
      .select("id, user_id, name, description, type, status, is_sensitive_data")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`No se pudieron leer las categorías: ${error.message}`);
    }
    return (data as FilaCategoria[]).map(categoriaDesdeFila);
  }

  async findById(userId: string, categoryId: string): Promise<Category | undefined> {
    const { data, error } = await this.cliente
      .from("categories")
      .select("id, user_id, name, description, type, status, is_sensitive_data")
      .eq("user_id", userId)
      .eq("id", categoryId)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo leer la categoría: ${error.message}`);
    }
    if (!data) return undefined;
    return categoriaDesdeFila(data as FilaCategoria);
  }

  async save(category: Category): Promise<void> {
    const { error } = await this.cliente.from("categories").upsert(filaDesdeCategoria(category));
    if (error) {
      throw new Error(`No se pudo guardar la categoría: ${error.message}`);
    }
  }

  async deactivateByName(name: string): Promise<void> {
    const { error } = await this.cliente.from("categories").update({ status: "inactive" }).eq("name", name);
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
    const { error } = await this.cliente
      .from("categories")
      .upsert(categories.map(filaDesdeCategoria), { onConflict: "user_id,name", ignoreDuplicates: true });
    if (error) {
      throw new Error(`No se pudieron guardar las categorías: ${error.message}`);
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.cliente.from("categories").delete().eq("user_id", userId);
    if (error) {
      throw new Error(`No se pudieron borrar las categorías: ${error.message}`);
    }
  }
}
