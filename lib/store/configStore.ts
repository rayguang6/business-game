import { create } from 'zustand';
import type { ConfigStore, GlobalSimulationConfigState, IndustryContentConfig } from './config/types';
import type { IndustryId, IndustryServiceDefinition, UpgradeDefinition } from '@/lib/game/types';
import type { GameEvent } from '@/lib/types/gameEvents';

const cloneIndustryConfig = (
  industryId: IndustryId,
  config: Omit<IndustryContentConfig, 'industryId'>,
): IndustryContentConfig => ({
  industryId,
  services: config.services.map((service) => ({ ...service })),
  upgrades: config.upgrades.map((upgrade) => ({
    ...upgrade,
    effects: upgrade.effects.map((effect) => ({ ...effect })),
  })),
  events: config.events.map((event) => ({
    ...event,
    choices: event.choices.map((choice) => ({
      ...choice,
      consequences: choice.consequences.map((consequence) => ({
        ...consequence,
        effects: consequence.effects.map((effect) => ({ ...effect })),
      })),
    })),
  })),
  marketingCampaigns: config.marketingCampaigns.map((campaign) => ({
    ...campaign,
    effects: campaign.effects.map((effect) => ({ ...effect })),
  })),
  staffRoles: config.staffRoles.map((role) => ({
    ...role,
    effects: role.effects.map((effect) => ({ ...effect })),
  })),
  staffPresets: config.staffPresets.map((preset) => ({ ...preset })),
  staffNamePool: config.staffNamePool ? [...config.staffNamePool] : undefined,
  flags: config.flags.map((flag) => ({ ...flag })),
  conditions: config.conditions.map((condition) => ({ ...condition })),
  layout: config.layout
    ? {
        entryPosition: { ...config.layout.entryPosition },
        waitingPositions: config.layout.waitingPositions.map((pos) => ({ ...pos })),
        serviceRooms: config.layout.serviceRooms.map((room) => ({
          roomId: room.roomId,
          customerPosition: { ...room.customerPosition },
          staffPosition: { ...room.staffPosition },
        })),
        staffPositions: config.layout.staffPositions.map((pos) => ({ ...pos })),
      }
    : undefined,
  // Industry-specific simulation config overrides
  businessMetrics: config.businessMetrics ? { ...config.businessMetrics } : undefined,
  businessStats: config.businessStats ? { ...config.businessStats } : undefined,
  movement: config.movement ? { ...config.movement } : undefined,
  mapConfig: config.mapConfig ? { ...config.mapConfig, walls: [...config.mapConfig.walls] } : undefined,
  capacityImage: config.capacityImage,
  winCondition: config.winCondition ? { ...config.winCondition } : undefined,
  loseCondition: config.loseCondition ? { ...config.loseCondition } : undefined,
  customerImages: config.customerImages ? [...config.customerImages] : undefined,
});

const cloneGlobalConfig = (config: GlobalSimulationConfigState | null) =>
  config ? { ...config } : null;

export const useConfigStore = create<ConfigStore>((set) => ({
  globalConfig: null,
  industryConfigs: {},
  configStatus: 'idle',
  configError: null,

  setGlobalConfig: (config) => {
    set({ globalConfig: cloneGlobalConfig(config) });
  },

  setIndustryConfig: (industryId, config) => {
    set((state) => ({
      industryConfigs: {
        ...state.industryConfigs,
        [industryId]: cloneIndustryConfig(industryId, config),
      },
    }));
  },

  setConfigStatus: (status, error = null) => {
    set({ configStatus: status, configError: error ?? null });
  },

  resetConfigState: () => {
    set({
      globalConfig: null,
      industryConfigs: {},
      configStatus: 'idle',
      configError: null,
    });
  },
}));

const EMPTY_SERVICES: IndustryServiceDefinition[] = [];
const EMPTY_UPGRADES: UpgradeDefinition[] = [];
const EMPTY_EVENTS: GameEvent[] = [];

const servicesCache = new WeakMap<IndustryContentConfig, IndustryServiceDefinition[]>();
const upgradesCache = new WeakMap<IndustryContentConfig, UpgradeDefinition[]>();
const eventsCache = new WeakMap<IndustryContentConfig, GameEvent[]>();

const cloneService = (service: IndustryServiceDefinition): IndustryServiceDefinition => ({ ...service });

const cloneUpgrade = (upgrade: UpgradeDefinition): UpgradeDefinition => ({
  ...upgrade,
  effects: upgrade.effects.map((effect) => ({ ...effect })),
});

const cloneEvent = (event: GameEvent): GameEvent => ({
  ...event,
  choices: event.choices.map((choice) => ({
    ...choice,
    consequences: choice.consequences.map((consequence) => ({
      ...consequence,
      effects: consequence.effects.map((effect) => ({ ...effect })),
    })),
  })),
});

const getServicesSnapshot = (config: IndustryContentConfig): IndustryServiceDefinition[] => {
  if (config.services.length === 0) {
    return EMPTY_SERVICES;
  }
  const cached = servicesCache.get(config);
  if (cached) {
    return cached;
  }
  const cloned = config.services.map(cloneService);
  servicesCache.set(config, cloned);
  return cloned;
};

const getUpgradesSnapshot = (config: IndustryContentConfig): UpgradeDefinition[] => {
  if (config.upgrades.length === 0) {
    return EMPTY_UPGRADES;
  }
  const cached = upgradesCache.get(config);
  if (cached) {
    return cached;
  }
  const cloned = config.upgrades.map(cloneUpgrade);
  upgradesCache.set(config, cloned);
  return cloned;
};

const getEventsSnapshot = (config: IndustryContentConfig): GameEvent[] => {
  if (config.events.length === 0) {
    return EMPTY_EVENTS;
  }
  const cached = eventsCache.get(config);
  if (cached) {
    return cached;
  }
  const cloned = config.events.map(cloneEvent);
  eventsCache.set(config, cloned);
  return cloned;
};

export const selectServicesForIndustry =
  (industryId: IndustryId) =>
  (state: ConfigStore): IndustryServiceDefinition[] => {
    const config = state.industryConfigs[industryId];
    if (!config) {
      return EMPTY_SERVICES;
    }
    return getServicesSnapshot(config);
  };

export const selectUpgradesForIndustry =
  (industryId: IndustryId) =>
  (state: ConfigStore): UpgradeDefinition[] => {
    const config = state.industryConfigs[industryId];
    if (!config) {
      return EMPTY_UPGRADES;
    }
    return getUpgradesSnapshot(config);
  };

export const selectEventsForIndustry =
  (industryId: IndustryId) =>
  (state: ConfigStore): GameEvent[] => {
    const config = state.industryConfigs[industryId];
    if (!config) {
      return EMPTY_EVENTS;
    }
    return getEventsSnapshot(config);
  };

export function getServicesFromStore(industryId: IndustryId): IndustryServiceDefinition[] {
  const config = useConfigStore.getState().industryConfigs[industryId];
  if (!config) {
    return EMPTY_SERVICES;
  }
  return getServicesSnapshot(config);
}

export function getUpgradesFromStore(industryId: IndustryId): UpgradeDefinition[] {
  const config = useConfigStore.getState().industryConfigs[industryId];
  if (!config) {
    return EMPTY_UPGRADES;
  }
  return getUpgradesSnapshot(config);
}

export function getEventsFromStore(industryId: IndustryId): GameEvent[] {
  const config = useConfigStore.getState().industryConfigs[industryId];
  if (!config) {
    return EMPTY_EVENTS;
  }
  return getEventsSnapshot(config);
}
