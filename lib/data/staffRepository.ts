import { supabase } from '@/lib/supabase/client';
import type { IndustryId } from '@/lib/game/types';
import type { StaffRoleConfig, StaffPreset } from '@/lib/game/staffConfig';

interface StaffRoleRow {
  id: string;
  industry_id: string;
  name: string;
  salary: number | string | null;
  service_speed: number | string | null;
  emoji: string | null;
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
    .map((row) => ({
      id: row.id,
      name: row.name,
      salary: parseNumber(row.salary),
      serviceSpeed: parseNumber(row.service_speed),
      emoji: row.emoji && row.emoji.trim() ? row.emoji.trim() : '🧑‍💼',
    }));
};

const mapPresetRows = (rows: StaffPresetRow[] | null | undefined): StaffPreset[] => {
  if (!rows || rows.length === 0) {
    return [];
  }

  return rows
    .filter((row) => row.id && row.role_id)
    .map((row) => ({
      id: row.id,
      name: row.name ?? undefined,
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
      .from<StaffRoleRow>('staff_roles')
      .select('id, industry_id, name, salary, service_speed, emoji')
      .eq('industry_id', industryId),
    supabase
      .from<StaffPresetRow>('staff_presets')
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
