import type {
  BusinessMetrics,
  BusinessStats,
  IndustryId,
  IndustryServiceDefinition,
  MovementConfig,
  SimulationLayoutConfig,
  UpgradeDefinition,
} from '@/lib/game/types';
import type { GameEvent } from '@/lib/types/gameEvents';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import type { StaffPreset, StaffRoleConfig } from '@/lib/game/staffConfig';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameCondition } from '@/lib/types/conditions';

export type ConfigLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface GlobalSimulationConfigState {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
}

export interface IndustryContentConfig {
  industryId: IndustryId;
  services: IndustryServiceDefinition[];
  upgrades: UpgradeDefinition[];
  events: GameEvent[];
  marketingCampaigns: MarketingCampaign[];
  staffRoles: StaffRoleConfig[];
  staffPresets: StaffPreset[];
  staffNamePool?: string[];
  flags: GameFlag[];
  conditions: GameCondition[];
  layout?: SimulationLayoutConfig;
  metadata?: {
    mapImage?: string;
    bedImage?: string;
  };
}

export interface ConfigStoreState {
  globalConfig: GlobalSimulationConfigState | null;
  industryConfigs: Record<IndustryId, IndustryContentConfig>;
  configStatus: ConfigLoadStatus;
  configError: string | null;
}

export interface ConfigStoreActions {
  setGlobalConfig: (config: GlobalSimulationConfigState | null) => void;
  setIndustryConfig: (
    industryId: IndustryId,
    config: Omit<IndustryContentConfig, 'industryId'>,
  ) => void;
  setConfigStatus: (status: ConfigLoadStatus, error?: string | null) => void;
  resetConfigState: () => void;
}

export type ConfigStore = ConfigStoreState & ConfigStoreActions;
