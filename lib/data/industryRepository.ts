import { supabaseServer } from '@/lib/server/supabaseServer';
import { Industry } from '@/lib/features/industries';

interface IndustryRow {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string | null;
  map_image: string | null;
  is_available: boolean | null;
}

export async function fetchIndustriesFromSupabase(): Promise<Industry[] | null> {
  if (!supabaseServer) return null;

  const { data, error } = await supabaseServer
    .from('industries')
    .select('id,name,icon,description,image,map_image,is_available');

  if (error) {
    console.error('[Industries] Failed to fetch industries:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return data.map(mapRowToIndustry);
}

const mapRowToIndustry = (row: IndustryRow): Industry => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  description: row.description,
  image: row.image ?? undefined,
  mapImage: row.map_image ?? undefined,
  isAvailable: row.is_available ?? undefined,
});

export async function upsertIndustryToSupabase(
  industry: Industry,
): Promise<{ success: boolean; data?: Industry; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: IndustryRow = {
    id: industry.id,
    name: industry.name,
    icon: industry.icon,
    description: industry.description,
    image: industry.image ?? null,
    map_image: industry.mapImage ?? null,
    is_available: industry.isAvailable ?? true,
  };

  const { data, error } = await supabaseServer
    .from('industries')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[Industries] Failed to upsert industry "${industry.id}":`, error);
    return { success: false, message: `Failed to save industry: ${error.message}` };
  }

  return { success: true, data: data ? mapRowToIndustry(data) : industry };
}

export async function deleteIndustryFromSupabase(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabaseServer.from('industries').delete().eq('id', id);

  if (error) {
    console.error(`[Industries] Failed to delete industry "${id}":`, error);
    return { success: false, message: `Failed to delete industry: ${error.message}` };
  }

  return { success: true };
}
