import type {
  BusinessMetrics,
  BusinessStats,
  IndustryId,
  IndustryServiceDefinition,
  MovementConfig,
  SimulationLayoutConfig,
  UpgradeDefinition,
  MapConfig,
} from '@/lib/game/types';
import type { GameEvent } from '@/lib/types/gameEvents';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import type { StaffPreset, StaffRoleConfig } from '@/lib/game/staffConfig';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameCondition } from '@/lib/types/conditions';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';

export type ConfigLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface GlobalSimulationConfigState {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
  mapConfig?: MapConfig;
  capacityImage?: string;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
  customerImages?: string[];
  staffNamePool?: string[];
  leadDialogues?: string[];
  // UI Configuration
  uiConfig?: {
    eventAutoSelectDurationSeconds?: number;
    outcomePopupDurationSeconds?: number;
  };
  // Layout config removed - each industry sets its own layout
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
  // Industry-specific simulation config overrides
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
  mapConfig?: MapConfig;
  capacityImage?: string;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
  customerImages?: string[];
  leadDialogues?: string[];
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
