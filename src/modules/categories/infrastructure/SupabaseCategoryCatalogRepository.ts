import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CatalogCategory } from "../domain/CatalogCategory";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository";

interface FilaCatalogo {
  id: string;
  name: string;
  description: string;
  name_en: string | null;
  description_en: string | null;
  is_sensitive_data: boolean;
  retired_at: string | null;
}

/** Adaptador real (supabase/migrations/0005_category_catalog.sql). Sin test propio: solo mapea filas ↔ CatalogCategory. */
export class SupabaseCategoryCatalogRepository implements CategoryCatalogRepository {
  private readonly cliente: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.cliente = createClient(url, serviceRoleKey);
  }

  async findAll(): Promise<CatalogCategory[]> {
    const { data, error } = await this.cliente.from("category_catalog").select("id, name, description, name_en, description_en, is_sensitive_data, retired_at");
    if (error) {
      throw new Error(`No se pudo leer el catálogo: ${error.message}`);
    }
    return (data as FilaCatalogo[]).map((fila) => ({
      id: fila.id,
      name: fila.name,
      description: fila.description,
      ...(fila.name_en ? { nameEn: fila.name_en } : {}),
      ...(fila.description_en ? { descriptionEn: fila.description_en } : {}),
      isSensitiveData: fila.is_sensitive_data,
      ...(fila.retired_at ? { retiredAt: new Date(fila.retired_at) } : {}),
    }));
  }

  async save(category: CatalogCategory): Promise<void> {
    const { error } = await this.cliente.from("category_catalog").upsert({
      id: category.id,
      name: category.name,
      description: category.description,
      name_en: category.nameEn ?? null,
      description_en: category.descriptionEn ?? null,
      is_sensitive_data: category.isSensitiveData,
      retired_at: category.retiredAt ? category.retiredAt.toISOString() : null,
    });
    if (error) {
      throw new Error(`No se pudo guardar la categoría del catálogo: ${error.message}`);
    }
  }
}
