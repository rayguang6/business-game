import { supabase } from '@/lib/supabase/client';
import { Industry } from '@/lib/features/industries';

export async function fetchIndustriesFromSupabase(): Promise<Industry[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('industries')
    .select('id,name,icon,description,image,map_image');

  if (error || !data) {
    return null;
  }

  return data.map(row => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    description: row.description,
    image: row.image ?? undefined,
    mapImage: row.map_image ?? undefined,
  } satisfies Industry));
}

