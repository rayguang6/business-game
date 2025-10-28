import type { Staff } from '@/lib/features/staff';

export type StaffRoleKey = 'assistant' | 'technician' | 'specialist';

interface StaffRoleConfig {
  role: string;
  salary: number;
  serviceSpeed: number;
  emoji: string;
}

export const STAFF_ROLE_CONFIGS: Record<StaffRoleKey, StaffRoleConfig> = {
  assistant: {
    role: 'Assistant',
    salary: 2600,
    serviceSpeed: 8,
    emoji: '👩‍⚕️',
  },
  technician: {
    role: 'Technician',
    salary: 3000,
    serviceSpeed: 10,
    emoji: '👨‍🔧',
  },
  specialist: {
    role: 'Specialist',
    salary: 3600,
    serviceSpeed: 14,
    emoji: '👨‍🔬',
  },
};

export const STAFF_ROLE_KEYS = Object.keys(STAFF_ROLE_CONFIGS) as StaffRoleKey[];

const ROLE_NAME_TO_KEY = STAFF_ROLE_KEYS.reduce<Record<string, StaffRoleKey>>((map, key) => {
  const config = STAFF_ROLE_CONFIGS[key];
  map[config.role] = key;
  return map;
}, {});

const createStaffId = (roleKey: StaffRoleKey) =>
  `${roleKey}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const STAFF_NAME_POOL = [
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

const getRandomStaffName = () =>
  STAFF_NAME_POOL[Math.floor(Math.random() * STAFF_NAME_POOL.length)];

export const createRandomStaff = (roleKey: StaffRoleKey): Staff => {
  const config = STAFF_ROLE_CONFIGS[roleKey];
  return {
    id: createStaffId(roleKey),
    name: getRandomStaffName(),
    salary: config.salary,
    increaseServiceSpeed: config.serviceSpeed,
    emoji: config.emoji,
    role: config.role,
  };
};

const createStaffFromPreset = (
  roleKey: StaffRoleKey,
  overrides: Partial<Staff> & Pick<Staff, 'id' | 'name'>,
): Staff => {
  const base = createRandomStaff(roleKey);
  return {
    ...base,
    ...overrides,
    role: overrides.role ?? base.role,
    salary: overrides.salary ?? base.salary,
    increaseServiceSpeed: overrides.increaseServiceSpeed ?? base.increaseServiceSpeed,
    emoji: overrides.emoji ?? base.emoji,
  };
};

export const INITIAL_STAFF_CONFIG: Staff[] = [
  createStaffFromPreset('assistant', {
    id: 'staff-initial-1',
    name: 'Alice',
    salary: 2600,
    increaseServiceSpeed: 8,
    emoji: '👩‍⚕️',
  }),
  createStaffFromPreset('specialist', {
    id: 'staff-initial-2',
    name: 'Bob',
    salary: 3400,
    increaseServiceSpeed: 12,
    emoji: '👨‍🔬',
  }),
];

export const createInitialAvailableStaff = (): Staff[] =>
  STAFF_ROLE_KEYS.map((roleKey) => createRandomStaff(roleKey));

export const getRoleKeyByRoleName = (roleName: string): StaffRoleKey =>
  ROLE_NAME_TO_KEY[roleName] ?? 'assistant';
