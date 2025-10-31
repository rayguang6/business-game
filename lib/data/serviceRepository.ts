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
    .from('services')
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
    .map(mapRowToService);
}

export async function upsertServiceForIndustry(
  service: IndustryServiceDefinition,
): Promise<{ success: boolean; data?: IndustryServiceDefinition; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: ServiceRow = {
    id: service.id,
    industry_id: service.industryId,
    name: service.name,
    duration: service.duration,
    price: service.price,
  };

  const { data, error } = await supabase
    .from('services')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Failed to upsert service', error);
    return { success: false, message: error.message };
  }

  return { success: true, data: data ? mapRowToService(data) : service };
}

export async function deleteServiceById(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabase.from('services').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete service', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

function mapRowToService(row: ServiceRow): IndustryServiceDefinition {
  return {
    id: row.id,
    industryId: row.industry_id,
    name: row.name,
    duration: row.duration ?? 0,
    price: row.price ?? 0,
  };
}
