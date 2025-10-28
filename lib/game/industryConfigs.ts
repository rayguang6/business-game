import { sampleEvents } from './events';
import type { GameEvent } from '@/lib/types/gameEvents';
import {
  BusinessMetrics,
  BusinessStats,
  MovementConfig,
  MapConfig,
  SimulationLayoutConfig,
  IndustryServiceDefinition,
  UpgradeDefinition,
  IndustrySimulationConfig,
  IndustryId,
  DEFAULT_INDUSTRY_ID,
} from './types';
import { GameMetric, EffectType } from './effectManager';

// -----------------------------------------------------------------------------
// Shared
// -----------------------------------------------------------------------------
const DEFAULT_BUSINESS_METRICS: BusinessMetrics = {
  startingCash: 15000,
  monthlyExpenses: 5000,
  startingReputation: 10,
} as const;

const DEFAULT_BUSINESS_STATS: BusinessStats = {
  ticksPerSecond: 10,
  monthDurationSeconds: 60,
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
  baseHappyProbability: 1,
  eventTriggerSeconds: [15, 30, 45],
  serviceRevenueMultiplier: 1,
  serviceRevenueScale: 10,
} as const;

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  customerTilesPerTick: 0.25,
  animationReferenceTilesPerTick: 0.25,
  walkFrameDurationMs: 200,
  minWalkFrameDurationMs: 80,
  maxWalkFrameDurationMs: 320,
  celebrationFrameDurationMs: 200,
} as const;

const DEFAULT_MAP_CONFIG: MapConfig = {
  width: 10,
  height: 10,
  walls: [

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
  { id: 'dental_cleaning', industryId: 'dental', name: 'Teeth Cleaning', duration: 5, price: 500 },
  { id: 'dental_filling', industryId: 'dental', name: 'Cavity Filling', duration: 5, price: 700 },
  { id: 'dental_root_canal', industryId: 'dental', name: 'Root Canal', duration: 5, price: 1000 },
];

const RESTAURANT_SERVICES: IndustryServiceDefinition[] = [
  { id: 'restaurant_fast_meal', industryId: 'restaurant', name: 'Express Meal', duration: 5, price: 60 },
  { id: 'restaurant_full_course', industryId: 'restaurant', name: 'Full Course Dinner', duration: 9, price: 90 },
  { id: 'restaurant_family_combo', industryId: 'restaurant', name: 'Family Combo', duration: 12, price: 130 },
];

const GYM_SERVICES: IndustryServiceDefinition[] = [
  { id: 'gym_quick_session', industryId: 'gym', name: 'Quick Training Session', duration: 5, price: 65 },
  { id: 'gym_group_class', industryId: 'gym', name: 'Group Fitness Class', duration: 8, price: 95 },
  { id: 'gym_personal_training', industryId: 'gym', name: 'Personal Training', duration: 11, price: 140 },
];

const DENTAL_UPGRADES: UpgradeDefinition[] = [
  {
    id: 'extra_treatment_room',
    name: 'Extra Service Room',
    description: 'Add another service room so more patients can be helped at once.',
    icon: '🦷',
    cost: 1200,
    maxLevel: 3,
    effects: [
      { metric: GameMetric.ServiceRooms, type: EffectType.Add, value: 1 },
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 150 },
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
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 20 }, // +20% service speed
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 90 },
    ],
  },
  {
    id: 'staff_training',
    name: 'Staff Training Program',
    description: 'Improve customer experience and keep service times tight with staff coaching.',
    icon: '👩‍⚕️',
    cost: 700,
    maxLevel: 3,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 10 }, // +10% service speed
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 80 },
    ],
  },
  {
    id: 'priority_booking',
    name: 'Priority Booking Software',
    description: 'Digital scheduling that packs the day and keeps the chairs full.',
    icon: '🗓️',
    cost: 800,
    maxLevel: 2,
    effects: [
      { metric: GameMetric.SpawnIntervalSeconds, type: EffectType.Percent, value: 25 }, // +25% customer spawn speed
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 110 },
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
      { metric: GameMetric.SpawnIntervalSeconds, type: EffectType.Percent, value: 15 }, // +15% customer spawn speed
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 70 },
    ],
  },
  {
    id: 'spa_waiting_area',
    name: 'Spa Waiting Area',
    description: 'Create a relaxing environment that streamlines the customer flow.',
    icon: '🛋️',
    cost: 450,
    maxLevel: 1,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 5 }, // +5% service speed
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 60 },
    ],
  },
  {
    id: 'premium_patient_packages',
    name: 'Premium Patient Packages',
    description: 'Bundle deluxe add-ons into every visit to raise average ticket size.',
    icon: '💎',
    cost: 650,
    maxLevel: 3,
    effects: [
      { metric: GameMetric.ServiceRevenueFlatBonus, type: EffectType.Add, value: 100 }, // +$100 per service
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 80 },
    ],
  },
  {
    id: 'dynamic_pricing_ai',
    name: 'Dynamic Pricing AI',
    description: 'Use AI-assisted pricing to automatically adjust fees for peak demand.',
    icon: '🤖',
    cost: 900,
    maxLevel: 2,
    effects: [
      { metric: GameMetric.ServiceRevenueMultiplier, type: EffectType.Percent, value: 15 }, // +15% price multiplier
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 120 },
    ],
  },
  {
    id: 'concierge_experience',
    name: 'Concierge Experience Program',
    description: 'Offer concierge-level amenities that dramatically increase willingness to pay.',
    icon: '🛎️',
    cost: 1200,
    maxLevel: 1,
    effects: [
      { metric: GameMetric.ServiceRevenueMultiplier, type: EffectType.Multiply, value: 1.5 }, // ×1.5 price multiplier
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 200 },
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
      { metric: GameMetric.ServiceRooms, type: EffectType.Add, value: 1 },
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 90 },
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
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 15 }, // +15% service speed
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 110 },
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
        id: 'business-as-usual',
        label: 'Business as Usual',
        description: 'Treat them like any other guest.',
        consequences: [
          {
            id: 'pleasantly-surprised',
            label: 'Pleasantly Surprised',
            weight: 40,
            effects: [
              { type: 'reputation', amount: 1 },
            ],
          },
          {
            id: 'no-coverage',
            label: 'No Coverage',
            weight: 40,
            effects: [],
          },
          {
            id: 'critical-piece',
            label: 'Critical Piece',
            weight: 20,
            effects: [
              { type: 'reputation', amount: -3 },
            ],
          },
        ],
      },
      {
        id: 'comp-service',
        label: 'Comp an Elegant Meal',
        description: 'Pull out your best dishes and comp the meal.',
        cost: 200,
        consequences: [
          {
            id: 'rave-review',
            label: 'Rave Review Published',
            weight: 50,
            effects: [
              { type: 'cash', amount: 400 },
              { type: 'reputation', amount: 6 },
            ],
          },
          {
            id: 'pleasant-dinner',
            label: 'Pleasant Dinner',
            weight: 30,
            effects: [
              { type: 'reputation', amount: 4 },
            ],
          },
          {
            id: 'lukewarm-response',
            label: 'Lukewarm Response',
            weight: 20,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
          },
        ],
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
        id: 'limited-menu',
        label: 'Run a Limited Menu',
        description: 'Explain the shortage to diners and reduce your offerings.',
        cost: 100,
        consequences: [
          {
            id: 'understanding-guests',
            label: 'Guests Understand',
            weight: 50,
            effects: [
              { type: 'reputation', amount: -2 },
            ],
          },
          {
            id: 'walk-outs',
            label: 'Walk-Outs Increase',
            weight: 30,
            effects: [
              { type: 'reputation', amount: -4 },
              { type: 'cash', amount: -50 },
            ],
          },
          {
            id: 'make-the-best',
            label: 'Make the Best of It',
            weight: 20,
            effects: [
              { type: 'cash', amount: -200 },
            ],
          },
        ],
      },
      {
        id: 'source-locally',
        label: 'Source Locally',
        description: 'Pay a premium to replace ingredients locally.',
        cost: 300,
        consequences: [
          {
            id: 'fresh-flavors',
            label: 'Fresh New Flavors',
            weight: 60,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
          },
          {
            id: 'supply-gap',
            label: 'Supply Gap',
            weight: 25,
            effects: [
              { type: 'reputation', amount: 1 },
              { type: 'cash', amount: -100 },
            ],
          },
          {
            id: 'mixed-feedback',
            label: 'Mixed Customer Feedback',
            weight: 15,
            effects: [],
          },
        ],
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
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 10 }, // +10% service speed
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 95 },
    ],
  },
  {
    id: 'gym_recovery_lounge',
    name: 'Recovery Lounge',
    description: 'Create a recovery lounge that keeps members energized between sessions.',
    icon: '🧘',
    cost: 600,
    maxLevel: 1,
    effects: [
      { metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: 8 }, // +8% service speed
      { metric: GameMetric.MonthlyExpenses, type: EffectType.Add, value: 70 },
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
        id: 'decline',
        label: 'Decline for Now',
        description: 'Save money and stick with current equipment.',
        consequences: [
          {
            id: 'status-quo',
            label: 'Status Quo',
            weight: 60,
            effects: [],
          },
          {
            id: 'members-disappointed',
            label: 'Members Disappointed',
            weight: 25,
            effects: [
              { type: 'reputation', amount: -2 },
            ],
          },
          {
            id: 'membership-drop',
            label: 'Membership Drop',
            weight: 15,
            effects: [
              { type: 'reputation', amount: -1 },
              { type: 'cash', amount: -100 },
            ],
          },
        ],
      },
      {
        id: 'buy-upgrade',
        label: 'Upgrade Equipment',
        description: 'Invest in the new machines to impress your members.',
        cost: 400,
        consequences: [
          {
            id: 'members-thrilled',
            label: 'Members Are Thrilled',
            weight: 50,
            effects: [
              { type: 'reputation', amount: 4 },
            ],
          },
          {
            id: 'buzz-surge',
            label: 'Social Buzz Surge',
            weight: 30,
            effects: [
              { type: 'cash', amount: 200 },
              { type: 'reputation', amount: 5 },
            ],
          },
          {
            id: 'slow-adoption',
            label: 'Slow Adoption',
            weight: 20,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
          },
        ],
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
        id: 'let-it-pass',
        label: 'Let It Pass',
        description: 'Trust them to resolve it on their own.',
        consequences: [
          {
            id: 'resentment-builds',
            label: 'Resentment Builds',
            weight: 50,
            effects: [
              { type: 'reputation', amount: -3 },
            ],
          },
          {
            id: 'full-blown-drama',
            label: 'Full-Blown Drama',
            weight: 30,
            effects: [
              { type: 'reputation', amount: -5 },
            ],
          },
          {
            id: 'self-resolution',
            label: 'They Self-Resolve',
            weight: 20,
            effects: [
              { type: 'reputation', amount: -1 },
            ],
          },
        ],
      },
      {
        id: 'mediate',
        label: 'Mediate Immediately',
        description: 'Bring them into your office and work out a plan.',
        cost: 50,
        consequences: [
          {
            id: 'team-unity',
            label: 'Team Unity Restored',
            weight: 60,
            effects: [
              { type: 'reputation', amount: 3 },
            ],
          },
          {
            id: 'mutual-compromise',
            label: 'Mutual Compromise',
            weight: 25,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
          },
          {
            id: 'overtime-bill',
            label: 'Overtime Bill',
            weight: 15,
            effects: [
              { type: 'cash', amount: -150 },
            ],
          },
        ],
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

const INDUSTRY_SIMULATION_CONFIGS: Record<string, IndustrySimulationConfig> = {
  [DEFAULT_INDUSTRY_ID]: {
    id: DEFAULT_INDUSTRY_ID,
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

export function getIndustrySimulationConfig(industryId: IndustryId): IndustrySimulationConfig {
  return INDUSTRY_SIMULATION_CONFIGS[industryId] ?? INDUSTRY_SIMULATION_CONFIGS[DEFAULT_INDUSTRY_ID];
}

export function getAllSimulationConfigs(): IndustrySimulationConfig[] {
  return Object.values(INDUSTRY_SIMULATION_CONFIGS);
}
