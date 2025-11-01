import { supabase } from '@/lib/supabase/client';
import { IndustryId } from '@/lib/game/types';

export interface GameFlag {
  id: string;
  industry_id: string;
  name: string;
  description: string;
}

interface FlagRow {
  id: string;
  industry_id: string;
  name: string;
  description: string | null;
}

export async function fetchFlagsForIndustry(
  industryId: IndustryId,
): Promise<GameFlag[] | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch flags.');
    return null;
  }

  const { data, error } = await supabase
    .from('flags')
    .select('id, industry_id, name, description')
    .eq('industry_id', industryId)
    .order('name');

  if (error) {
    console.error('Failed to fetch flags from Supabase', error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data
    .filter((row) => Boolean(row.id) && Boolean(row.name))
    .map((row) => ({
      id: row.id,
      industry_id: row.industry_id,
      name: row.name,
      description: row.description || '',
    }));
}

export async function upsertFlagForIndustry(
  industryId: IndustryId,
  flag: { id: string; name: string; description: string },
): Promise<{ success: boolean; message?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: FlagRow = {
    id: flag.id,
    industry_id: industryId,
    name: flag.name,
    description: flag.description || null,
  };

  const { error } = await supabase
    .from('flags')
    .upsert(payload, { onConflict: 'industry_id,id' });

  if (error) {
    console.error('Failed to upsert flag', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function deleteFlagById(id: string): Promise<{ success: boolean; message?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabase.from('flags').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete flag', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

