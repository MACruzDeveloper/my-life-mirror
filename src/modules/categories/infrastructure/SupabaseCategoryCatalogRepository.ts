import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "#shared/domain/locales.js";
import type { CatalogCategory, CategoryText } from "../domain/CatalogCategory.js";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository.js";

interface CatalogRow {
  id: string;
  key: string | null;
  is_sensitive_data: boolean;
  ai_excluded: boolean | null;
  retired_at: string | null;
}

interface TranslationRow {
  catalog_id: string;
  locale: string;
  name: string;
  description: string;
}

/**
 * Adaptador real: `category_catalog` + `category_translations` (una fila por
 * categoría e idioma, migración 0009), unidas aquí en un solo `CatalogCategory`.
 * Las columnas `name`/`description` de `category_catalog` se mantienen con el
 * texto del idioma por defecto (son obligatorias y tienen el índice único
 * histórico), pero la interfaz ya no las lee. Sin test propio: solo mapea filas.
 */
export class SupabaseCategoryCatalogRepository implements CategoryCatalogRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createServiceClient(url, serviceRoleKey);
  }

  async findAll(): Promise<CatalogCategory[]> {
    const [catalog, translations] = await Promise.all([
      this.client.from("category_catalog").select("id, key, is_sensitive_data, ai_excluded, retired_at"),
      this.client.from("category_translations").select("catalog_id, locale, name, description"),
    ]);
    if (catalog.error) throw new Error(`No se pudo leer el catálogo: ${catalog.error.message}`);
    if (translations.error) throw new Error(`No se pudieron leer las traducciones del catálogo: ${translations.error.message}`);

    const byCatalogId = new Map<string, Partial<Record<Locale, CategoryText>>>();
    for (const row of translations.data as TranslationRow[]) {
      if (!isSupportedLocale(row.locale)) continue;
      byCatalogId.set(row.catalog_id, { ...byCatalogId.get(row.catalog_id), [row.locale]: { name: row.name, description: row.description } });
    }

    return (catalog.data as CatalogRow[]).map((row) => ({
      id: row.id,
      ...(row.key ? { key: row.key } : {}),
      translations: byCatalogId.get(row.id) ?? {},
      isSensitiveData: row.is_sensitive_data,
      ...(row.ai_excluded ? { aiExcluded: true } : {}),
      ...(row.retired_at ? { retiredAt: new Date(row.retired_at) } : {}),
    }));
  }

  async save(category: CatalogCategory): Promise<void> {
    const defaultText = category.translations[DEFAULT_LOCALE];
    if (!defaultText) throw new Error(`Falta el texto en ${DEFAULT_LOCALE} de la categoría ${category.id}`);

    const { error } = await this.client.from("category_catalog").upsert({
      id: category.id,
      key: category.key ?? null,
      name: defaultText.name,
      description: defaultText.description,
      is_sensitive_data: category.isSensitiveData,
      ai_excluded: category.aiExcluded === true,
      retired_at: category.retiredAt ? category.retiredAt.toISOString() : null,
    });
    if (error) throw new Error(`No se pudo guardar la categoría del catálogo: ${error.message}`);

    const rows = Object.entries(category.translations).map(([locale, text]) => ({
      catalog_id: category.id,
      locale,
      name: text.name,
      description: text.description,
    }));
    const { error: translationsError } = await this.client.from("category_translations").upsert(rows, { onConflict: "catalog_id,locale" });
    if (translationsError) throw new Error(`No se pudieron guardar las traducciones de la categoría: ${translationsError.message}`);
  }
}
