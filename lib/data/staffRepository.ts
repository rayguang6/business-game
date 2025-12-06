import { supabaseServer } from '@/lib/server/supabaseServer';
import type { IndustryId } from '@/lib/game/types';
import type { StaffRoleConfig, StaffPreset } from '@/lib/game/staffConfig';
import type { UpgradeEffect } from '@/lib/game/types';
import { validateAndParseUpgradeEffects } from '@/lib/utils/effectValidation';

interface StaffRoleRow {
  id: string;
  industry_id: string;
  name: string;
  salary: number | string | null;
  effects?: unknown; // JSONB column for effects array
  sets_flag: string | null;
  requirements: unknown;
  sprite_image?: string | null; // Path to sprite image (can be local or Supabase Storage URL)
}

interface StaffPresetRow {
  id: string;
  industry_id: string;
  role_id: string;
  name: string | null;
  salary_override: number | string | null;
  service_speed_override: number | string | null;
}

export interface StaffDataResult {
  roles: StaffRoleConfig[];
  initialStaff: StaffPreset[];
  namePool: string[];
}

const parseNumber = (value: number | string | null | undefined, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const mapRoleRows = (rows: StaffRoleRow[] | null | undefined): StaffRoleConfig[] => {
  if (!rows || rows.length === 0) {
    return [];
  }

  const roles: StaffRoleConfig[] = [];
  
  for (const row of rows) {
    if (!row.id || !row.name) {
      console.warn(`[Staff] Skipping role with missing required fields: id=${row.id}, name=${row.name}`);
      continue;
    }
    
    try {
      // Parse effects JSONB with error handling
      let effects: UpgradeEffect[] = [];
      if (row.effects) {
        try {
          effects = validateAndParseUpgradeEffects(row.effects);
        } catch (err) {
          console.error(`[Staff] Failed to parse effects for role "${row.id}":`, err);
          effects = [];
        }
      }
      
      // Parse requirements JSONB with error handling
      let requirements: any[] = [];
      if (row.requirements) {
        if (Array.isArray(row.requirements)) {
          requirements = row.requirements;
        } else {
          console.warn(`[Staff] Invalid requirements format for role "${row.id}": expected array, got ${typeof row.requirements}`);
        }
      }
      
      roles.push({
        id: row.id,
        name: row.name,
        salary: parseNumber(row.salary),
        effects,
        spriteImage: row.sprite_image && row.sprite_image.trim() ? row.sprite_image.trim() : undefined,
        setsFlag: row.sets_flag || undefined,
        requirements,
      });
    } catch (err) {
      console.error(`[Staff] Failed to process role "${row.id}":`, err);
      // Continue processing other roles
    }
  }
  
  return roles;
};

const mapPresetRows = (rows: StaffPresetRow[] | null | undefined): StaffPreset[] => {
  if (!rows || rows.length === 0) {
    return [];
  }

  return rows
    .filter((row) => row.id && row.role_id)
    .map((row) => ({
      id: row.id,
      name: row.name ?? 'Staff',
      roleId: row.role_id,
      salary: row.salary_override !== null ? parseNumber(row.salary_override) : undefined,
      serviceSpeed:
        row.service_speed_override !== null
          ? parseNumber(row.service_speed_override)
          : undefined,
    }));
};

export async function fetchStaffDataForIndustry(
  industryId: IndustryId,
): Promise<StaffDataResult | null> {
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch staff.');
    return null;
  }

  const [rolesResponse, presetsResponse] = await Promise.all([
    supabaseServer
      .from('staff_roles')
      .select('id, industry_id, name, salary, effects, sets_flag, requirements, sprite_image')
      .eq('industry_id', industryId),
    supabaseServer
      .from('staff_presets')
      .select('id, industry_id, role_id, name, salary_override, service_speed_override, emoji_override')
      .eq('industry_id', industryId),
  ]);

  if (rolesResponse.error) {
    console.error(`[Staff] Failed to fetch roles for industry "${industryId}":`, rolesResponse.error);
    return null;
  }

  if (presetsResponse.error) {
    console.error(`[Staff] Failed to fetch presets for industry "${industryId}":`, presetsResponse.error);
    return null;
  }

  const roles = mapRoleRows(rolesResponse.data);
  if (roles.length === 0) {
    return null;
  }

  const initialStaff = mapPresetRows(presetsResponse.data);

  return {
    roles,
    initialStaff,
    namePool: [],
  };
}

export async function upsertStaffRole(role: {
  id: string;
  industryId: IndustryId;
  name: string;
  salary: number;
  effects: UpgradeEffect[];
  spriteImage?: string;
  setsFlag?: string;
  requirements?: any[];
}): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Convert effects array to JSON (already validated)
  const effectsJson = role.effects.map(effect => ({
    metric: effect.metric,
    type: effect.type,
    value: effect.value,
  }));

  const payload: StaffRoleRow = {
    id: role.id,
    industry_id: role.industryId,
    name: role.name,
    salary: role.salary,
    effects: effectsJson,
    sprite_image: role.spriteImage ?? null,
    sets_flag: role.setsFlag || null,
    requirements: role.requirements || [],
  };

  const { error } = await supabaseServer
    .from('staff_roles')
    .upsert(payload, { onConflict: 'industry_id,id' });

  if (error) {
    console.error(`[Staff] Failed to upsert role "${role.id}" for industry "${role.industryId}":`, error);
    return { success: false, message: `Failed to save role: ${error.message}` };
  }

  return { success: true };
}

export async function deleteStaffRole(id: string, industryId: IndustryId): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Delete only from the specific industry to ensure isolation
  const { error } = await supabaseServer
    .from('staff_roles')
    .delete()
    .eq('id', id)
    .eq('industry_id', industryId);
  if (error) {
    console.error(`[Staff] Failed to delete role "${id}" for industry "${industryId}":`, error);
    return { success: false, message: `Failed to delete role: ${error.message}` };
  }
  return { success: true };
}

export async function upsertStaffPreset(preset: {
  id: string;
  industryId: IndustryId;
  roleId: string;
  name?: string;
  salary?: number;
  serviceSpeed?: number;
}): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Validate required fields
  if (!preset.id || !preset.industryId || !preset.roleId) {
    console.error('Missing required fields for staff preset:', {
      id: preset.id,
      industryId: preset.industryId,
      roleId: preset.roleId
    });
    return { success: false, message: 'Missing required fields: id, industryId, and roleId are required.' };
  }

  const payload: StaffPresetRow = {
    id: preset.id,
    industry_id: preset.industryId,
    role_id: preset.roleId,
    name: preset.name ?? null,
    salary_override: preset.salary ?? null,
    service_speed_override: preset.serviceSpeed ?? null,
  };


  const { error } = await supabaseServer
    .from('staff_presets')
    .upsert(payload, { onConflict: 'industry_id,id' });

  if (error) {
    console.error(`[Staff] Failed to upsert preset "${preset.id}" for industry "${preset.industryId}":`, error);
    return { success: false, message: `Failed to save preset: ${error.message}` };
  }

  return { success: true };
}

export async function deleteStaffPreset(id: string, industryId: IndustryId): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Delete only from the specific industry to ensure isolation
  const { error } = await supabaseServer
    .from('staff_presets')
    .delete()
    .eq('id', id)
    .eq('industry_id', industryId);
  if (error) {
    console.error(`[Staff] Failed to delete preset "${id}" for industry "${industryId}":`, error);
    return { success: false, message: `Failed to delete preset: ${error.message}` };
  }
  return { success: true };
}
