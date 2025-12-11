import { supabaseServer } from '@/lib/server/supabaseServer';
import { GameCondition, ConditionMetric, ConditionOperator } from '@/lib/types/conditions';
import { IndustryId } from '@/lib/game/types';
import { cleanupConditionReferences } from './referenceCleanup';

interface ConditionRow {
  id: string;
  industry_id: string;
  name: string;
  description: string;
  metric: string;
  operator: string;
  value: number;
}

export async function fetchConditionsForIndustry(
  industryId: IndustryId,
): Promise<GameCondition[] | null> {
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch conditions.');
    return null;
  }

  try {
    const { data, error } = await supabaseServer
      .from('conditions')
      .select('id, industry_id, name, description, metric, operator, value')
      .eq('industry_id', industryId)
      .order('name');

    if (error) {
      console.error(`[Conditions] Failed to fetch conditions for industry "${industryId}":`, error);
      // Check if the table exists
      if (error.code === '42P01') { // PostgreSQL table doesn't exist error
        console.error('[Conditions] The conditions table does not exist. Please run database migrations.');
        throw new Error('Database table "conditions" does not exist. Please contact an administrator.');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data
      .filter((row) => Boolean(row.id) && Boolean(row.name) && Boolean(row.metric))
      .map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        metric: row.metric as ConditionMetric,
        operator: row.operator as ConditionOperator,
        value: Number(row.value) || 0,
      }));
  } catch (error) {
    console.error(`[Conditions] Unexpected error fetching conditions for industry "${industryId}":`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching conditions.');
  }
}

export async function upsertConditionForIndustry(
  industryId: IndustryId,
  condition: GameCondition,
): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Auto-generate clean ID if not provided (no prefix)
  let finalId = condition.id;
  if (!finalId) {
    finalId = condition.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const payload: ConditionRow = {
    id: finalId,
    industry_id: industryId,
    name: condition.name,
    description: condition.description || '',
    metric: condition.metric,
    operator: condition.operator,
    value: condition.value,
  };

  const { error } = await supabaseServer
    .from('conditions')
    .upsert(payload, { onConflict: 'industry_id,id' });

  if (error) {
    console.error(`[Conditions] Failed to upsert condition "${condition.id}" for industry "${industryId}":`, error);
    return { success: false, message: `Failed to save condition: ${error.message}` };
  }

  return { success: true };
}

export async function deleteConditionById(id: string): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // First, clean up all references to this condition in other tables
  const cleanupResult = await cleanupConditionReferences(id);
  if (!cleanupResult.success) {
    console.warn('Failed to cleanup condition references, proceeding with deletion:', cleanupResult.message);
  }

  // Then delete the condition itself
  const { error } = await supabaseServer.from('conditions').delete().eq('id', id);
  if (error) {
    console.error(`[Conditions] Failed to delete condition "${id}":`, error);
    return { success: false, message: `Failed to delete condition: ${error.message}` };
  }

  return { success: true };
}
