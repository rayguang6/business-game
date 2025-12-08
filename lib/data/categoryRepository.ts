import { supabaseServer } from '@/lib/server/supabaseServer';
import type { IndustryId, Category } from '@/lib/game/types';

interface CategoryRow {
  id: string;
  industry_id: string | null;
  name: string;
  order_index: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchCategoriesForIndustry(industryId: IndustryId): Promise<Category[] | null> {
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch categories.');
    return null;
  }

  const { data, error } = await supabaseServer
    .from('categories')
    .select('id, industry_id, name, order_index, description, created_at, updated_at')
    .eq('industry_id', industryId)
    .order('order_index', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error(`[Categories] Failed to fetch categories for industry "${industryId}":`, error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const categories: Category[] = [];

  for (const row of data) {
    if (!row.id || !row.name) {
      console.warn(`[Categories] Skipping category with missing required fields: id=${row.id}, name=${row.name}`);
      continue;
    }

    categories.push({
      id: row.id,
      industryId: row.industry_id || undefined,
      name: row.name,
      orderIndex: row.order_index,
      description: row.description || undefined,
    });
  }

  return categories;
}

export async function upsertCategoryForIndustry(
  industryId: IndustryId,
  category: Category,
): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  if (!category.id || !category.name) {
    return { success: false, message: 'Category id and name are required.' };
  }

  const payload: CategoryRow = {
    id: category.id,
    industry_id: industryId,
    name: category.name,
    order_index: category.orderIndex,
    description: category.description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try upsert first
  const { error } = await supabaseServer
    .from('categories')
    .upsert(payload);

  if (error) {
    // If upsert fails, try insert (for cases where the constraint doesn't support upsert)
    console.warn(`[Categories] Upsert failed, trying insert for category "${category.id}":`, error);

    const { error: insertError } = await supabaseServer
      .from('categories')
      .insert(payload);

    if (insertError) {
      // If insert also fails, try update
      console.warn(`[Categories] Insert failed, trying update for category "${category.id}":`, insertError);

      const { error: updateError } = await supabaseServer
        .from('categories')
        .update({
          name: category.name,
          order_index: category.orderIndex,
          description: category.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', category.id)
        .eq('industry_id', industryId);

      if (updateError) {
        console.error(`[Categories] Failed to save category "${category.id}":`, updateError);
        return { success: false, message: `Failed to save category: ${updateError.message}` };
      }
    }
  }

  return { success: true };
}

export async function deleteCategoryById(id: string): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabaseServer.from('categories').delete().eq('id', id);
  if (error) {
    console.error(`[Categories] Failed to delete category "${id}":`, error);
    return { success: false, message: `Failed to delete category: ${error.message}` };
  }
  return { success: true };
}