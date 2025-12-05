import { supabaseServer } from '@/lib/server/supabaseServer';
import { IndustryId } from '@/lib/game/types';
import { cleanupFlagReferences } from './referenceCleanup';

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
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch flags.');
    return null;
  }

  const { data, error } = await supabaseServer
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
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Auto-generate clean ID if not provided (no prefix)
  let finalId = flag.id;
  if (!finalId) {
    finalId = flag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const payload: FlagRow = {
    id: finalId,
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
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // First, clean up all references to this flag in other tables
  const cleanupResult = await cleanupFlagReferences(id);
  if (!cleanupResult.success) {
    console.warn('Failed to cleanup flag references, proceeding with deletion:', cleanupResult.message);
  }

  // Then delete the flag itself
  const { error } = await supabaseServer.from('flags').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete flag', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}


