import type { Staff } from '@/lib/features/staff';
import type { IndustryId, Requirement, UpgradeEffect } from '@/lib/game/types';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { useConfigStore } from '@/lib/store/configStore';

export interface StaffRoleConfig {
  id: string;
  name: string;
  salary: number;
  effects: UpgradeEffect[];
  emoji: string;
  spriteImage?: string;
  setsFlag?: string;
  requirements?: Requirement[];
}

export interface StaffPreset {
  id: string;
  name: string;
  roleId: string;
  salary?: number;
  serviceSpeed?: number;
  workloadReduction?: number;
  emoji?: string;
}

const DEFAULT_NAME_POOL = [
  'Ava',
  'Noah',
  'Mia',
  'Ethan',
  'Liam',
  'Zara',
  'Kai',
  'Riya',
  'Owen',
  'Sage',
  'Nico',
  'Luna',
  'Milo',
  'Iris',
  'Ezra',
] as const;

const createStaffId = (roleId: string): string =>
  `${roleId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const cloneStaff = (staff: Staff): Staff => ({ ...staff });

const cloneRole = (role: StaffRoleConfig): StaffRoleConfig => ({
  ...role,
  effects: role.effects.map((effect) => ({ ...effect })),
});

const clonePreset = (preset: StaffPreset): StaffPreset => ({ ...preset });

const getIndustryStaffConfig = (industryId: IndustryId) =>
  useConfigStore.getState().industryConfigs[industryId];

const getRolesSource = (industryId: IndustryId): StaffRoleConfig[] => {
  const config = getIndustryStaffConfig(industryId);
  // Only use industry-specific roles, no fallback to defaults
  const roles = config?.staffRoles && config.staffRoles.length > 0 ? config.staffRoles : [];
  return roles.map(cloneRole);
};

const getNamePoolSource = (industryId: IndustryId): string[] => {
  const config = getIndustryStaffConfig(industryId);
  const pool =
    config?.staffNamePool && config.staffNamePool.length > 0
      ? config.staffNamePool
      : DEFAULT_NAME_POOL;
  return pool.slice();
};

const getPresetSource = (industryId: IndustryId): StaffPreset[] => {
  const config = getIndustryStaffConfig(industryId);
  // Only use industry-specific presets, no fallback to defaults
  const presets =
    config?.staffPresets && config.staffPresets.length > 0
      ? config.staffPresets
      : [];
  return presets.map(clonePreset);
};

function resolveRole(industryId: IndustryId, roleId?: string): StaffRoleConfig | null {
  const roles = getRolesSource(industryId);
  if (roles.length === 0) {
    return null;
  }

  if (roleId) {
    const match = roles.find((role) => role.id === roleId);
    if (match) {
      return match;
    }
    // No fallback - return null if role not found in this industry
    return null;
  }

  // Return first role if no specific roleId requested
  return roles[0];
}

function pickRandomName(industryId: IndustryId): string {
  const pool = getNamePoolSource(industryId);
  if (pool.length === 0) {
    return 'Staff';
  }
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

function buildStaffFromRole(
  role: StaffRoleConfig,
  overrides: Partial<Staff> & { id: string; name: string },
): Staff {
  return {
    id: overrides.id,
    name: overrides.name,
    role: overrides.role ?? role.name,
    roleId: role.id,
    salary: overrides.salary ?? role.salary,
    effects: overrides.effects ?? role.effects.map((effect) => ({ ...effect })),
    emoji: overrides.emoji ?? role.emoji,
    spriteImage: overrides.spriteImage ?? role.spriteImage,
    setsFlag: overrides.setsFlag ?? role.setsFlag,
    requirements: overrides.requirements ?? role.requirements,
  };
}

export function getStaffRolesForIndustry(industryId: IndustryId): StaffRoleConfig[] {
  return getRolesSource(industryId);
}

export function getStaffNamePoolForIndustry(industryId: IndustryId): string[] {
  return getNamePoolSource(industryId);
}

export function getInitialStaffForIndustry(industryId: IndustryId): Staff[] {
  const roles = getRolesSource(industryId);
  const presets = getPresetSource(industryId);

  if (roles.length === 0) {
    return [];
  }

  const roleMap = new Map(roles.map((role) => [role.id, role]));

  return presets.map((preset) => {
    // Only look for roles in the current industry, no fallback to default industry
    const role = roleMap.get(preset.roleId) ?? resolveRole(industryId, preset.roleId);

    if (!role) {
      throw new Error(
        `No staff role "${preset.roleId}" found for preset "${preset.id}" in industry "${industryId}". Please ensure the role exists for this industry.`,
      );
    }

    const name = preset.name?.trim() || pickRandomName(industryId);

    return buildStaffFromRole(role, {
      id: preset.id,
      name,
      salary: preset.salary,
      emoji: preset.emoji,
    });
  });
}

export function createRandomStaffForIndustry(
  industryId: IndustryId,
  roleId?: string,
): Staff {
  const role = resolveRole(industryId, roleId);
  if (!role) {
    throw new Error(`No staff roles configured for industry "${industryId}"`);
  }

  return {
    id: createStaffId(role.id),
    name: pickRandomName(industryId),
    role: role.name,
    roleId: role.id,
    salary: role.salary,
    effects: role.effects.map((effect) => ({ ...effect })),
    emoji: role.emoji,
    spriteImage: role.spriteImage,
    setsFlag: role.setsFlag,
    requirements: role.requirements,
  };
}

export function createInitialAvailableStaff(industryId: IndustryId): Staff[] {
  const roles = getRolesSource(industryId);
  if (roles.length === 0) {
    return [];
  }

  return roles.map((role) => createRandomStaffForIndustry(industryId, role.id));
}

const DEFAULT_ROLES: StaffRoleConfig[] = [
  {
    id: 'assistant',
    name: 'Assistant',
    salary: 2600,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 8 },
      { metric: GameMetric.FreedomScore, type: EffectType.Add, value: -8 },
    ],
    emoji: '👩‍⚕️',
  },
  {
    id: 'technician',
    name: 'Technician',
    salary: 3000,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 10 },
      { metric: GameMetric.FreedomScore, type: EffectType.Add, value: -10 },
    ],
    emoji: '👨‍🔧',
  },
  {
    id: 'specialist',
    name: 'Specialist',
    salary: 3600,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 14 },
      { metric: GameMetric.FreedomScore, type: EffectType.Add, value: -14 },
    ],
    emoji: '👨‍🔬',
  },
];

const DEFAULT_INITIAL_STAFF: StaffPreset[] = [
  {
    id: 'staff-initial-1',
    name: 'Alice',
    roleId: 'assistant',
    salary: 2600,
    emoji: '👩‍⚕️',
  },
  {
    id: 'staff-initial-2',
    name: 'Bob',
    roleId: 'specialist',
    salary: 3600,
    emoji: '👨‍🔬',
  },
];
