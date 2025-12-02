import { supabase } from '@/lib/supabase/client';
import type { IndustryId, IndustryServiceDefinition, Requirement, ServicePricingCategory } from '@/lib/game/types';

interface ServiceRow {
  id: string;
  industry_id: string;
  name: string;
  duration: number | null;
  price: number | null;
  requirements?: unknown; // JSONB column for requirements array
  pricing_category?: string | null; // low, mid, or high
  weightage?: number | null; // Weight for random selection
  required_staff_role_ids?: string[] | null; // Array of staff role IDs that can perform this service
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
    .select('id, industry_id, name, duration, price, requirements, pricing_category, weightage, required_staff_role_ids')
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
    pricing_category: service.pricingCategory || null,
    weightage: service.weightage ?? null,
    required_staff_role_ids: service.requiredStaffRoleIds && service.requiredStaffRoleIds.length > 0 
      ? service.requiredStaffRoleIds 
      : null,
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
  // Parse requirements - ensure it's a valid array with all fields
  let requirements: Requirement[] = [];
  if (row.requirements) {
    if (Array.isArray(row.requirements)) {
      requirements = row.requirements
        .map((req: any) => {
          // Validate requirement has required fields
          if (!req.type || !req.id) {
            return null;
          }
          
          const requirement: Requirement = {
            type: req.type,
            id: req.id,
          };
          
          // Add optional fields based on type
          if (req.type === 'flag') {
            requirement.expected = req.expected !== undefined ? req.expected : true;
          } else if (['metric', 'upgrade', 'staff'].includes(req.type)) {
            // Numeric types need operator and value
            if (req.operator) {
              requirement.operator = req.operator;
            }
            if (req.value !== undefined && req.value !== null) {
              requirement.value = typeof req.value === 'number' ? req.value : Number(req.value);
            }
          }
          
          return requirement;
        })
        .filter((req: Requirement | null): req is Requirement => req !== null && req.id.length > 0);
    }
  }

  // Parse pricing category - validate it's one of the allowed values
  let pricingCategory: ServicePricingCategory | undefined;
  if (row.pricing_category && ['low', 'mid', 'high'].includes(row.pricing_category.toLowerCase())) {
    pricingCategory = row.pricing_category.toLowerCase() as ServicePricingCategory;
  }

  // Parse required staff role IDs
  let requiredStaffRoleIds: string[] | undefined;
  if (row.required_staff_role_ids && Array.isArray(row.required_staff_role_ids)) {
    requiredStaffRoleIds = row.required_staff_role_ids.filter((id): id is string => 
      typeof id === 'string' && id.length > 0
    );
    if (requiredStaffRoleIds.length === 0) {
      requiredStaffRoleIds = undefined;
    }
  }

  return {
    id: row.id,
    industryId: row.industry_id,
    name: row.name,
    duration: row.duration ?? 0,
    price: row.price ?? 0,
    requirements: requirements.length > 0 ? requirements : undefined,
    pricingCategory,
    weightage: row.weightage ?? undefined,
    requiredStaffRoleIds,
  };
}
