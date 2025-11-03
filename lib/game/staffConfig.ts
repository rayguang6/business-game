import type { Staff } from '@/lib/features/staff';
import type { IndustryId, Requirement } from '@/lib/game/types';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';

import type { UpgradeEffect } from '@/lib/game/types';

export interface StaffRoleConfig {
  id: string;
  name: string;
  salary: number;
  effects: UpgradeEffect[]; // Flexible effects like upgrades
  emoji: string;
  spriteImage?: string; // Optional sprite image path (falls back to default if not set)
  setsFlag?: string; // Optional flag to set when this staff role is hired
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
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

const STAFF_ROLES_BY_INDUSTRY: Record<string, StaffRoleConfig[]> = {};
const STAFF_NAME_POOL_BY_INDUSTRY: Record<string, string[]> = {};
const INITIAL_STAFF_BY_INDUSTRY: Record<string, Staff[]> = {};

const createStaffId = (roleId: string): string =>
  `${roleId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const cloneStaff = (staff: Staff): Staff => ({ ...staff });

function getInternalRoles(industryId: IndustryId): StaffRoleConfig[] {
  return STAFF_ROLES_BY_INDUSTRY[industryId] ?? STAFF_ROLES_BY_INDUSTRY[DEFAULT_INDUSTRY_ID] ?? [];
}

function getInternalNamePool(industryId: IndustryId): string[] {
  return STAFF_NAME_POOL_BY_INDUSTRY[industryId] ??
    STAFF_NAME_POOL_BY_INDUSTRY[DEFAULT_INDUSTRY_ID] ??
    [...DEFAULT_NAME_POOL];
}

function resolveRole(industryId: IndustryId, roleId?: string): StaffRoleConfig | null {
  const roles = STAFF_ROLES_BY_INDUSTRY[industryId];
  if (roles && roles.length > 0) {
    if (roleId) {
      const match = roles.find((role) => role.id === roleId);
      if (match) {
        return match;
      }
    }
    return roles[0];
  }

  const defaultRoles = STAFF_ROLES_BY_INDUSTRY[DEFAULT_INDUSTRY_ID];
  if (defaultRoles && defaultRoles.length > 0) {
    if (roleId) {
      const match = defaultRoles.find((role) => role.id === roleId);
      if (match) {
        return match;
      }
    }
    return defaultRoles[0];
  }

  return null;
}

function buildStaffFromRole(
  industryId: IndustryId,
  role: StaffRoleConfig,
  overrides: Partial<Staff> & { id: string; name: string },
): Staff {
  return {
    id: overrides.id,
    name: overrides.name,
    role: overrides.role ?? role.name,
    roleId: role.id,
    salary: overrides.salary ?? role.salary,
    effects: overrides.effects ?? role.effects.map(effect => ({ ...effect })), // Deep copy effects
    emoji: overrides.emoji ?? role.emoji,
    spriteImage: overrides.spriteImage ?? role.spriteImage,
    setsFlag: overrides.setsFlag ?? role.setsFlag,
    requirements: overrides.requirements ?? role.requirements,
  };
}

function pickRandomName(industryId: IndustryId): string {
  const pool = getInternalNamePool(industryId);
  if (pool.length === 0) {
    return 'Staff';
  }
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export function setStaffRolesForIndustry(
  industryId: IndustryId,
  roles: StaffRoleConfig[],
): void {
  STAFF_ROLES_BY_INDUSTRY[industryId] = roles.map((role) => ({ ...role }));
}

export function getStaffRolesForIndustry(industryId: IndustryId): StaffRoleConfig[] {
  return getInternalRoles(industryId).map((role) => ({ ...role }));
}

export function setStaffNamePoolForIndustry(industryId: IndustryId, names: string[]): void {
  const sanitized = names.map((name) => name.trim()).filter(Boolean);
  STAFF_NAME_POOL_BY_INDUSTRY[industryId] = sanitized.length > 0 ? sanitized : [...DEFAULT_NAME_POOL];
}

export function setInitialStaffForIndustry(
  industryId: IndustryId,
  presets: StaffPreset[],
): void {
  const roles = getInternalRoles(industryId);
  const roleMap = new Map(roles.map((role) => [role.id, role]));

  const nextInitial = presets.map((preset) => {
    const role =
      roleMap.get(preset.roleId) ??
      resolveRole(industryId, preset.roleId) ??
      resolveRole(DEFAULT_INDUSTRY_ID, preset.roleId);

    if (!role) {
      throw new Error(`No staff role configured for preset "${preset.id}" in industry "${industryId}"`);
    }

    const name = preset.name?.trim() || pickRandomName(industryId);

    return buildStaffFromRole(industryId, role, {
      id: preset.id,
      name,
      salary: preset.salary,
      emoji: preset.emoji,
    });
  });

  INITIAL_STAFF_BY_INDUSTRY[industryId] = nextInitial.map(cloneStaff);
}

export function getInitialStaffForIndustry(industryId: IndustryId): Staff[] {
  const initial =
    INITIAL_STAFF_BY_INDUSTRY[industryId] ??
    INITIAL_STAFF_BY_INDUSTRY[DEFAULT_INDUSTRY_ID] ??
    [];
  return initial.map(cloneStaff);
}

export function getStaffNamePoolForIndustry(industryId: IndustryId): string[] {
  return [...getInternalNamePool(industryId)];
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
    effects: role.effects.map(effect => ({ ...effect })), // Deep copy effects
    emoji: role.emoji,
    spriteImage: role.spriteImage,
    setsFlag: role.setsFlag,
    requirements: role.requirements,
  };
}

export function createInitialAvailableStaff(industryId: IndustryId): Staff[] {
  const roles = getInternalRoles(industryId);
  if (roles.length === 0) {
    return [];
  }

  return roles.map((role) => createRandomStaffForIndustry(industryId, role.id));
}

export function clearStaffDataForIndustry(industryId: IndustryId): void {
  delete STAFF_ROLES_BY_INDUSTRY[industryId];
  delete STAFF_NAME_POOL_BY_INDUSTRY[industryId];
  delete INITIAL_STAFF_BY_INDUSTRY[industryId];
}

const DEFAULT_ROLES: StaffRoleConfig[] = [
  {
    id: 'assistant',
    name: 'Assistant',
    salary: 2600,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 8 },
      { metric: GameMetric.FounderWorkingHours, type: EffectType.Add, value: -8 },
    ],
    emoji: '👩‍⚕️',
  },
  {
    id: 'technician',
    name: 'Technician',
    salary: 3000,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 10 },
      { metric: GameMetric.FounderWorkingHours, type: EffectType.Add, value: -10 },
    ],
    emoji: '👨‍🔧',
  },
  {
    id: 'specialist',
    name: 'Specialist',
    salary: 3600,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 14 },
      { metric: GameMetric.FounderWorkingHours, type: EffectType.Add, value: -14 },
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

setStaffRolesForIndustry(DEFAULT_INDUSTRY_ID, DEFAULT_ROLES);
setStaffNamePoolForIndustry(DEFAULT_INDUSTRY_ID, [...DEFAULT_NAME_POOL]);
setInitialStaffForIndustry(DEFAULT_INDUSTRY_ID, DEFAULT_INITIAL_STAFF);
