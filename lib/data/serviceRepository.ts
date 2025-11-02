import { supabase } from '@/lib/supabase/client';
import type { IndustryId, IndustryServiceDefinition, Requirement } from '@/lib/game/types';

interface ServiceRow {
  id: string;
  industry_id: string;
  name: string;
  duration: number | null;
  price: number | null;
  requirements?: unknown; // JSONB column for requirements array
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
    .select('id, industry_id, name, duration, price, requirements')
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
    requirements: service.requirements || [],
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
  // Parse requirements - ensure it's a valid array
  let requirements: Requirement[] = [];
  if (row.requirements) {
    if (Array.isArray(row.requirements)) {
      requirements = row.requirements.map((req: any) => ({
        type: req.type || 'flag',
        id: req.id || '',
        expected: req.expected !== undefined ? req.expected : true,
      })).filter((req: Requirement) => req.id.length > 0);
    }
  }

  return {
    id: row.id,
    industryId: row.industry_id,
    name: row.name,
    duration: row.duration ?? 0,
    price: row.price ?? 0,
    requirements: requirements.length > 0 ? requirements : undefined,
  };
}
