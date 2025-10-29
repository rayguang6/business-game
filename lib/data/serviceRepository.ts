import { supabase } from '@/lib/supabase/client';
import type { IndustryId, IndustryServiceDefinition } from '@/lib/game/types';

interface ServiceRow {
  id: string;
  industry_id: string;
  name: string;
  duration: number | null;
  price: number | null;
}

export async function fetchServicesForIndustry(
  industryId: IndustryId,
): Promise<IndustryServiceDefinition[] | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch services.');
    return null;
  }

  const { data, error } = await supabase
    .from<ServiceRow>('services')
    .select('id, industry_id, name, duration, price')
    .eq('industry_id', industryId);

  if (error) {
    console.error('Failed to fetch services from Supabase', error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data
    .filter((row) => Boolean(row.id) && Boolean(row.name))
    .map((row) => ({
      id: row.id,
      industryId: row.industry_id,
      name: row.name,
      duration: row.duration ?? 0,
      price: row.price ?? 0,
    }));
}
