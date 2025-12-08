import { supabaseServer } from '@/lib/server/supabaseServer';
import type { IndustryId, IndustryServiceDefinition, Requirement, ServicePricingCategory, ServiceTier } from '@/lib/game/types';

interface ServiceRow {
  id: string;
  industry_id: string;
  name: string;
  duration: number | null;
  price: number | null;
  tier?: string | null; // basic, professional, enterprise
  exp_gained?: number | null; // Experience points awarded
  requirements?: unknown; // JSONB column for requirements array
  pricing_category?: string | null; // low, mid, or high
  weightage?: number | null; // Weight for random selection
  required_staff_role_ids?: string[] | null; // Array of staff role IDs that can perform this service
  time_cost?: number | null; // Amount of time this service costs
  order?: number | null; // Display order
}

export async function fetchServicesForIndustry(
  industryId: IndustryId,
): Promise<IndustryServiceDefinition[] | null> {
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch services.');
    return null;
  }

  const { data, error } = await supabaseServer
    .from('services')
    .select('id, industry_id, name, duration, price, tier, exp_gained, requirements, pricing_category, weightage, required_staff_role_ids, time_cost, order')
    .eq('industry_id', industryId)
    .order('order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (error) {
    console.error(`[Services] Failed to fetch services for industry "${industryId}":`, error);
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
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: ServiceRow = {
    id: service.id,
    industry_id: service.industryId,
    name: service.name,
    duration: service.duration,
    price: service.price,
    tier: service.tier || null,
    exp_gained: service.expGained ?? null,
    requirements: service.requirements || [],
    pricing_category: service.pricingCategory || null,
    weightage: service.weightage ?? null,
    required_staff_role_ids: service.requiredStaffRoleIds && service.requiredStaffRoleIds.length > 0
      ? service.requiredStaffRoleIds
      : null,
    time_cost: service.timeCost ?? null,
    order: service.order ?? 0,
  };

  const { data, error } = await supabaseServer
    .from('services')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[Services] Failed to upsert service "${service.id}" for industry "${service.industryId}":`, error);
    return { success: false, message: `Failed to save service: ${error.message}` };
  }

  return { success: true, data: data ? mapRowToService(data) : service };
}

export async function deleteServiceById(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabaseServer.from('services').delete().eq('id', id);

  if (error) {
    console.error(`[Services] Failed to delete service "${id}":`, error);
    return { success: false, message: `Failed to delete service: ${error.message}` };
  }

  return { success: true };
}

function mapRowToService(row: ServiceRow): IndustryServiceDefinition {
  // Parse requirements - ensure it's a valid array with all fields
  let requirements: Requirement[] = [];
  if (row.requirements) {
    try {
      if (Array.isArray(row.requirements)) {
        requirements = row.requirements
          .map((req: any) => {
            // Validate requirement has required fields
            if (!req || typeof req !== 'object' || !req.type || !req.id) {
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
      } else {
        console.warn(`[Services] Invalid requirements format for service "${row.id}": expected array, got ${typeof row.requirements}`);
      }
    } catch (err) {
      console.error(`[Services] Failed to parse requirements for service "${row.id}":`, err);
      requirements = [];
    }
  }

  // Parse tier - validate it's one of the allowed values
  let tier: ServiceTier | undefined;
  if (row.tier && ['small', 'medium', 'big'].includes(row.tier.toLowerCase())) {
    tier = row.tier.toLowerCase() as ServiceTier;
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
    tier,
    expGained: row.exp_gained ?? undefined,
    requirements: requirements.length > 0 ? requirements : undefined,
    pricingCategory,
    weightage: row.weightage ?? undefined,
    requiredStaffRoleIds,
    timeCost: row.time_cost ?? undefined,
    order: row.order ?? 0,
  };
}
