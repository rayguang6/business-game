import { sampleEvents } from './events';
import type { GameEvent } from '@/lib/types/gameEvents';
import type {
  BusinessMetrics,
  BusinessStats,
  MovementConfig,
  MapConfig,
  SimulationLayoutConfig,
  IndustryServiceDefinition,
  UpgradeDefinition,
  IndustrySimulationConfig,
  IndustryId,
} from './types';

// -----------------------------------------------------------------------------
// Shared
// -----------------------------------------------------------------------------
const DEFAULT_BUSINESS_METRICS: BusinessMetrics = {
  startingCash: 3000,
  weeklyExpenses: 800,
  startingReputation: 5,
} as const;

const DEFAULT_BUSINESS_STATS: BusinessStats = {
  ticksPerSecond: 10,
  weekDurationSeconds: 30,
  customerSpawnIntervalSeconds: 3,
  customerPatienceSeconds: 10,
  leavingAngryDurationTicks: 10,
  customerSpawnArea: {
    x: { min: 0, max: 2 },
    y: { min: 7, max: 9 },
  },
  waitingChairs: 4,
  treatmentRooms: 2,
  reputationGainPerHappyCustomer: 1,
  reputationLossPerAngryCustomer: 1,
  baseHappyProbability: 0.7,
} as const;

const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  customerTilesPerTick: 0.15,
  animationReferenceTilesPerTick: 0.15,
  walkFrameDurationMs: 200,
  minWalkFrameDurationMs: 80,
  maxWalkFrameDurationMs: 320,
  celebrationFrameDurationMs: 200,
} as const;

const DEFAULT_MAP_CONFIG: MapConfig = {
  width: 10,
  height: 10,
  walls: [
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
    { x: 3, y: 4 },
  ],
} as const;

const DEFAULT_LAYOUT: SimulationLayoutConfig = {
  entryPosition: { x: 4, y: 9 },
  waitingPositions: [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 3 },
    { x: 1, y: 4 },
    { x: 1, y: 5 },
    { x: 1, y: 6 },
    { x: 1, y: 7 },
    { x: 1, y: 8 },
  ],
  serviceRoomPositions: [
    { x: 5, y: 2 },
    { x: 6, y: 2 },
    { x: 7, y: 2 },
    { x: 8, y: 2 },
    { x: 9, y: 2 },
  ],
} as const;

const DEFAULT_CUSTOMER_IMAGES = [
  '/images/customer/customer1.png',
  '/images/customer/customer2.png',
  '/images/customer/customer3.png',
  '/images/customer/customer4.png',
  '/images/customer/customer5.png',
  '/images/customer/customer6.png',
  '/images/customer/customer7.png',
  '/images/customer/customer8.png',
  '/images/customer/customer9.png',
  '/images/customer/customer10.png',
];

// -----------------------------------------------------------------------------
// Industry Specific
// -----------------------------------------------------------------------------
const DENTAL_SERVICES: IndustryServiceDefinition[] = [
  { id: 'dental_cleaning', name: 'Teeth Cleaning', duration: 10, price: 100 },
  { id: 'dental_filling', name: 'Cavity Filling', duration: 10, price: 200 },
  { id: 'dental_root_canal', name: 'Root Canal', duration: 10, price: 300 },
];

const RESTAURANT_SERVICES: IndustryServiceDefinition[] = [
  { id: 'restaurant_fast_meal', name: 'Express Meal', duration: 5, price: 60 },
  { id: 'restaurant_full_course', name: 'Full Course Dinner', duration: 9, price: 90 },
  { id: 'restaurant_family_combo', name: 'Family Combo', duration: 12, price: 130 },
];

const GYM_SERVICES: IndustryServiceDefinition[] = [
  { id: 'gym_quick_session', name: 'Quick Training Session', duration: 5, price: 65 },
  { id: 'gym_group_class', name: 'Group Fitness Class', duration: 8, price: 95 },
  { id: 'gym_personal_training', name: 'Personal Training', duration: 11, price: 140 },
];

const DENTAL_UPGRADES: UpgradeDefinition[] = [
  {
    id: 'extra_treatment_room',
    name: 'Extra Treatment Room',
    description: 'Add another treatment room so more patients can be helped at once.',
    icon: '🦷',
    cost: 1200,
    maxLevel: 3,
    effects: [
      { metric: 'treatmentRooms', type: 'add', value: 1, source: 'Extra Treatment Room' },
      { metric: 'weeklyExpenses', type: 'add', value: 150, source: 'Extra Treatment Room' },
    ],
  },
  {
    id: 'modern_equipment',
    name: 'Modern Equipment',
    description: 'Speed up service time with modern dental equipment.',
    icon: '⚡',
    cost: 900,
    maxLevel: 2,
    effects: [
      { metric: 'serviceSpeedMultiplier', type: 'percent', value: -0.2, source: 'Modern Equipment' },
      { metric: 'weeklyExpenses', type: 'add', value: 90, source: 'Modern Equipment' },
    ],
  },
  {
    id: 'staff_training',
    name: 'Staff Training Program',
    description: 'Improve customer experience and reputation gains with staff coaching.',
    icon: '👩‍⚕️',
    cost: 700,
    maxLevel: 3,
    effects: [
      { metric: 'reputationMultiplier', type: 'percent', value: 0.25, source: 'Staff Training Program' },
      { metric: 'weeklyExpenses', type: 'add', value: 80, source: 'Staff Training Program' },
    ],
  },
  {
    id: 'marketing_blitz',
    name: 'Local Marketing Blitz',
    description: 'Bring patients in faster with a short marketing campaign.',
    icon: '📣',
    cost: 600,
    maxLevel: 2,
    effects: [
      { metric: 'spawnIntervalSeconds', type: 'percent', value: -0.15, source: 'Local Marketing Blitz' },
      { metric: 'weeklyExpenses', type: 'add', value: 70, source: 'Local Marketing Blitz' },
    ],
  },
  {
    id: 'spa_waiting_area',
    name: 'Spa Waiting Area',
    description: 'Create a relaxing environment that keeps customers calm and patient.',
    icon: '🛋️',
    cost: 450,
    maxLevel: 1,
    effects: [
      { metric: 'reputationMultiplier', type: 'percent', value: 0.15, source: 'Spa Waiting Area' },
      { metric: 'weeklyExpenses', type: 'add', value: 60, source: 'Spa Waiting Area' },
    ],
  },
];

const DENTAL_EVENTS: GameEvent[] = [...sampleEvents];

const RESTAURANT_UPGRADES: UpgradeDefinition[] = [
  {
    id: 'restaurant_extra_table',
    name: 'Expanded Seating',
    description: 'Add a few extra tables to welcome more guests during peak hours.',
    icon: '🪑',
    cost: 800,
    maxLevel: 2,
    effects: [
      { metric: 'treatmentRooms', type: 'add', value: 1, source: 'Expanded Seating' },
      { metric: 'weeklyExpenses', type: 'add', value: 90, source: 'Expanded Seating' },
    ],
  },
  {
    id: 'restaurant_kitchen_upgrade',
    name: 'Kitchen Line Upgrade',
    description: 'Streamline the kitchen line to serve dishes a bit faster.',
    icon: '👨‍🍳',
    cost: 950,
    maxLevel: 2,
    effects: [
      { metric: 'serviceSpeedMultiplier', type: 'percent', value: -0.15, source: 'Kitchen Line Upgrade' },
      { metric: 'weeklyExpenses', type: 'add', value: 110, source: 'Kitchen Line Upgrade' },
    ],
  },
];

const RESTAURANT_EVENTS: GameEvent[] = [
  {
    id: 'restaurant-food-critic',
    title: 'Food Critic Visit',
    category: 'opportunity',
    summary: 'A famous critic drops by for dinner without reservations.',
    choices: [
      {
        id: 'comp-service',
        label: 'Comp an Elegant Meal',
        description: 'Pull out your best dishes and comp the meal.',
        effects: [
          { type: 'cash', amount: -200 },
          { type: 'reputation', amount: 5 },
        ],
      },
      {
        id: 'business-as-usual',
        label: 'Business as Usual',
        description: 'Treat them like any other guest.',
        effects: [
          { type: 'reputation', amount: 1 },
        ],
        isDefault: true,
      },
    ],
  },
  {
    id: 'restaurant-supply-shortage',
    title: 'Supply Shortage',
    category: 'risk',
    summary: 'Your seafood supplier calls to say shipments are delayed.',
    choices: [
      {
        id: 'source-locally',
        label: 'Source Locally',
        description: 'Pay a premium to replace ingredients locally.',
        effects: [
          { type: 'cash', amount: -300 },
          { type: 'reputation', amount: 2 },
        ],
      },
      {
        id: 'limited-menu',
        label: 'Run a Limited Menu',
        description: 'Explain the shortage to diners and reduce your offerings.',
        effects: [
          { type: 'cash', amount: -100 },
          { type: 'reputation', amount: -2 },
        ],
        isDefault: true,
      },
    ],
  },
  {
    id: 'restaurant-community-festival',
    title: 'Community Food Festival',
    category: 'opportunity',
    summary: 'A local food festival invites your restaurant to host a booth.',
    choices: [
      {
        id: 'join-festival',
        label: 'Join the Festival',
        description: 'Invest in a booth and showcase your signature dishes.',
        effects: [
          { type: 'cash', amount: -150 },
          { type: 'reputation', amount: 4 },
        ],
      },
      {
        id: 'stay-put',
        label: 'Stay Put',
        description: 'Focus on regulars instead.',
        effects: [],
        isDefault: true,
      },
    ],
  },
];

const GYM_UPGRADES: UpgradeDefinition[] = [
  {
    id: 'gym_new_equipment',
    name: 'New Training Equipment',
    description: 'Invest in a new set of training gear to reduce customer wait times.',
    icon: '🏋️',
    cost: 850,
    maxLevel: 2,
    effects: [
      { metric: 'serviceSpeedMultiplier', type: 'percent', value: -0.1, source: 'New Training Equipment' },
      { metric: 'weeklyExpenses', type: 'add', value: 95, source: 'New Training Equipment' },
    ],
  },
  {
    id: 'gym_recovery_lounge',
    name: 'Recovery Lounge',
    description: 'Create a recovery lounge that keeps members happier for longer.',
    icon: '🧘',
    cost: 600,
    maxLevel: 1,
    effects: [
      { metric: 'reputationMultiplier', type: 'percent', value: 0.2, source: 'Recovery Lounge' },
      { metric: 'weeklyExpenses', type: 'add', value: 70, source: 'Recovery Lounge' },
    ],
  },
];

const GYM_EVENTS: GameEvent[] = [
  {
    id: 'gym-equipment-upgrade',
    title: 'Equipment Upgrade Offer',
    category: 'opportunity',
    summary: 'A vendor offers premium treadmills at a discount.',
    choices: [
      {
        id: 'buy-upgrade',
        label: 'Upgrade Equipment',
        description: 'Invest in the new machines to impress your members.',
        effects: [
          { type: 'cash', amount: -400 },
          { type: 'reputation', amount: 4 },
        ],
      },
      {
        id: 'decline',
        label: 'Decline for Now',
        description: 'Save money and stick with current equipment.',
        effects: [],
        isDefault: true,
      },
    ],
  },
  {
    id: 'gym-trainer-conflict',
    title: 'Trainer Conflict',
    category: 'risk',
    summary: 'Two trainers argue about class schedules in front of clients.',
    choices: [
      {
        id: 'mediate',
        label: 'Mediate Immediately',
        description: 'Bring them into your office and work out a plan.',
        effects: [
          { type: 'cash', amount: -50 },
          { type: 'reputation', amount: 3 },
        ],
      },
      {
        id: 'let-it-pass',
        label: 'Let It Pass',
        description: 'Trust them to resolve it on their own.',
        effects: [
          { type: 'reputation', amount: -3 },
        ],
        isDefault: true,
      },
    ],
  },
  {
    id: 'gym-local-marathon',
    title: 'Local Marathon Collaboration',
    category: 'opportunity',
    summary: 'The city marathon wants your gym to run a warm-up session.',
    choices: [
      {
        id: 'host-session',
        label: 'Host a Warm-up Session',
        description: 'Dedicate trainers and resources to the marathon.',
        effects: [
          { type: 'cash', amount: -120 },
          { type: 'reputation', amount: 5 },
        ],
      },
      {
        id: 'decline-invite',
        label: 'Decline the Invite',
        description: 'Stay focused on existing members.',
        effects: [],
        isDefault: true,
      },
    ],
  },
];

const SHARED_BASE = {
  businessMetrics: DEFAULT_BUSINESS_METRICS,
  businessStats: DEFAULT_BUSINESS_STATS,
  movement: DEFAULT_MOVEMENT_CONFIG,
  map: DEFAULT_MAP_CONFIG,
  layout: DEFAULT_LAYOUT,
  customerImages: DEFAULT_CUSTOMER_IMAGES,
  defaultCustomerImage: DEFAULT_CUSTOMER_IMAGES[0],
} as const;

const INDUSTRY_SIMULATION_CONFIGS: Record<IndustryId, IndustrySimulationConfig> = {
  dental: {
    id: 'dental',
    ...SHARED_BASE,
    services: DENTAL_SERVICES,
    upgrades: DENTAL_UPGRADES,
    events: DENTAL_EVENTS,
  },
  restaurant: {
    id: 'restaurant',
    ...SHARED_BASE,
    services: RESTAURANT_SERVICES,
    upgrades: RESTAURANT_UPGRADES,
    events: RESTAURANT_EVENTS,
  },
  gym: {
    id: 'gym',
    ...SHARED_BASE,
    services: GYM_SERVICES,
    upgrades: GYM_UPGRADES,
    events: GYM_EVENTS,
  },
};

export function getIndustrySimulationConfig(industryId: string): IndustrySimulationConfig {
  return INDUSTRY_SIMULATION_CONFIGS[industryId as IndustryId] ?? INDUSTRY_SIMULATION_CONFIGS.dental;
}

export function getAllSimulationConfigs(): IndustrySimulationConfig[] {
  return Object.values(INDUSTRY_SIMULATION_CONFIGS);
}
