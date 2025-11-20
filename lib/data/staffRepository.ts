import { supabase } from '@/lib/supabase/client';
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
  emoji: string | null;
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
  emoji_override: string | null;
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

  return rows
    .filter((row) => row.id && row.name)
    .map((row) => {
      // Validate and parse effects - only accept valid JSON using enum validation
      const effects: UpgradeEffect[] = validateAndParseUpgradeEffects(row.effects);

      return {
        id: row.id,
        name: row.name,
        salary: parseNumber(row.salary),
        effects,
        emoji: row.emoji && row.emoji.trim() ? row.emoji.trim() : '🧑‍💼',
        spriteImage: row.sprite_image && row.sprite_image.trim() ? row.sprite_image.trim() : undefined,
        setsFlag: row.sets_flag || undefined,
        requirements: Array.isArray(row.requirements) ? row.requirements as any[] : [],
      };
    });
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
      emoji: row.emoji_override ?? undefined,
    }));
};

export async function fetchStaffDataForIndustry(
  industryId: IndustryId,
): Promise<StaffDataResult | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch staff.');
    return null;
  }

  const [rolesResponse, presetsResponse] = await Promise.all([
    supabase
      .from('staff_roles')
      .select('id, industry_id, name, salary, effects, emoji, sets_flag, requirements, sprite_image')
      .eq('industry_id', industryId),
    supabase
      .from('staff_presets')
      .select('id, industry_id, role_id, name, salary_override, service_speed_override, emoji_override')
      .eq('industry_id', industryId),
  ]);

  if (rolesResponse.error) {
    console.error('Failed to fetch staff roles from Supabase', rolesResponse.error);
    return null;
  }

  if (presetsResponse.error) {
    console.error('Failed to fetch staff presets from Supabase', presetsResponse.error);
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
  emoji?: string;
  spriteImage?: string;
  setsFlag?: string;
  requirements?: any[];
}): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
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
    emoji: role.emoji ?? null,
    sprite_image: role.spriteImage ?? null,
    sets_flag: role.setsFlag || null,
    requirements: role.requirements || [],
  };

  const { error } = await supabase
    .from('staff_roles')
    .upsert(payload, { onConflict: 'industry_id,id' });

  if (error) {
    console.error('Failed to upsert staff role', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function deleteStaffRole(id: string, industryId: IndustryId): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Delete only from the specific industry to ensure isolation
  const { error } = await supabase
    .from('staff_roles')
    .delete()
    .eq('id', id)
    .eq('industry_id', industryId);
  if (error) {
    console.error('Failed to delete staff role', error);
    return { success: false, message: error.message };
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
  emoji?: string;
}): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: StaffPresetRow = {
    id: preset.id,
    industry_id: preset.industryId,
    role_id: preset.roleId,
    name: preset.name ?? null,
    salary_override: preset.salary ?? null,
    service_speed_override: preset.serviceSpeed ?? null,
    emoji_override: preset.emoji ?? null,
  };

  const { error } = await supabase
    .from('staff_presets')
    .upsert(payload, { onConflict: 'industry_id,id' });

  if (error) {
    console.error('Failed to upsert staff preset', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function deleteStaffPreset(id: string, industryId: IndustryId): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Delete only from the specific industry to ensure isolation
  const { error } = await supabase
    .from('staff_presets')
    .delete()
    .eq('id', id)
    .eq('industry_id', industryId);
  if (error) {
    console.error('Failed to delete staff preset', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}
