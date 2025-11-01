import { supabase } from '@/lib/supabase/client';
import { GameCondition } from '@/lib/types/conditions';
import { IndustryId } from '@/lib/game/types';

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
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch conditions.');
    return null;
  }

  const { data, error } = await supabase
    .from('conditions')
    .select('id, industry_id, name, description, metric, operator, value')
    .eq('industry_id', industryId)
    .order('name');

  if (error) {
    console.error('Failed to fetch conditions from Supabase', error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data
    .filter((row) => Boolean(row.id) && Boolean(row.name) && Boolean(row.metric))
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      metric: row.metric as any, // Will be validated by GameMetric enum
      operator: row.operator as any,
      value: Number(row.value) || 0,
    }));
}

export async function upsertConditionForIndustry(
  industryId: IndustryId,
  condition: GameCondition,
): Promise<{ success: boolean; message?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: ConditionRow = {
    id: condition.id,
    industry_id: industryId,
    name: condition.name,
    description: condition.description || '',
    metric: condition.metric,
    operator: condition.operator,
    value: condition.value,
  };

  const { error } = await supabase
    .from('conditions')
    .upsert(payload);

  if (error) {
    console.error('Failed to upsert condition', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function deleteConditionById(id: string): Promise<{ success: boolean; message?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabase.from('conditions').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete condition', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}
