import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { OneTimeCost, OneTimeCostCategory } from '../types';
import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import { checkRequirements } from '@/lib/game/requirementChecker';
import type { Requirement, IndustryId } from '@/lib/game/types';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { useConfigStore } from '@/lib/store/configStore';
import type { Customer } from '@/lib/features/customers';
import type { Lead } from '@/lib/features/leads';
import { generateLeads } from '@/lib/features/leads';
import { SourceType, SourceInfo } from '@/lib/config/sourceTypes';
import { SourceHelpers } from '@/lib/utils/financialTracking';

// Marketing campaign effect (simplified from full Effect, no ID/source yet)
export interface CampaignEffect {
  metric: GameMetric;
  type: EffectType;
  value: number;
  durationMonths?: number | null; // null = permanent, number = expires after months
  description?: string; // Optional custom description to override technical effect text
}

// Level config for leveled marketing campaigns (similar to UpgradeLevelConfig)
export interface MarketingCampaignLevelConfig {
  level: number;
  name: string;
  description?: string;
  icon?: string;
  cost: number;
  timeCost?: number;
  effects: CampaignEffect[];
}

// Marketing campaign type: 'leveled' = level-based like upgrades, 'unlimited' = unlimited clicks
export type MarketingCampaignType = 'leveled' | 'unlimited';

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  type: MarketingCampaignType; // 'leveled' or 'unlimited'
  cooldownSeconds: number; // How long before this campaign can be run again (same for all levels)
  categoryId?: string; // Optional reference to categories table
  setsFlag?: string; // Optional flag to set when campaign is launched
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
  order?: number; // Display order (lower = shown first, defaults to 0)
  
  // For unlimited campaigns (type === 'unlimited')
  cost?: number; // Cash cost (or time cost if timeCost is specified)
  timeCost?: number; // Optional time cost (hours)
  effects?: CampaignEffect[]; // Effects for unlimited campaigns
  
  // For leveled campaigns (type === 'leveled')
  maxLevel?: number; // Maximum level (required for leveled campaigns)
  levels?: MarketingCampaignLevelConfig[]; // Level-specific configs (required for leveled campaigns)
}

export interface MarketingSlice {
  campaignCooldowns: Record<string, number>; // campaignId -> cooldownEndTime
  campaignLevels: Record<string, number>; // campaignId -> current level (for leveled campaigns)
  campaignsActivatedThisMonth: Set<string>; // campaignIds that were launched this month
  startCampaign: (campaignId: string) => { success: boolean; message?: string };
  getCampaignLevel: (campaignId: string) => number;
  wasCampaignActivatedThisMonth: (campaignId: string) => boolean;
  resetMonthlyMarketingTracking: () => void;
  tickMarketing: (currentGameTime: number) => void;
  resetMarketing: () => void;
  resetMarketingLevels: () => void; // Reset levels only, keep effects active
}

/**
 * Add marketing campaign effects to the effect manager
 * For direct state metrics (Cash, Time, SkillLevel, GenerateLeads), apply directly
 */
function addMarketingEffects(
  campaign: MarketingCampaign,
  effects: CampaignEffect[],
  campaignName: string,
  currentGameTime: number,
  store?: {
    applyCashChange?: (amount: number) => void;
    applyTimeChange?: (amount: number) => void;
    applyExpChange?: (amount: number) => void;
    recordEventRevenue?: (amount: number, labelOrSource?: string | SourceInfo, label?: string) => void;
    recordEventExpense?: (amount: number, labelOrSource: string | SourceInfo, label?: string) => void;
    recordTimeSpent?: (amount: number, labelOrSource?: string | SourceInfo, label?: string) => void;
    spawnLead?: () => Lead;
    updateLeads?: (leads: Lead[]) => void;
    spawnCustomer?: () => Customer;
    addCustomers?: (customers: Customer[]) => void;
    getState?: () => { leads: Lead[]; leadProgress: number; conversionRate: number };
    updateLeadProgress?: (progress: number) => void;
  }
): void {
  effects.forEach((effect, index) => {
    // Direct state metrics (Cash, Time, SkillLevel, GenerateLeads) with Add effects are applied directly
    // These are one-time permanent effects (no duration tracking)
    if ((effect.metric === GameMetric.Cash || effect.metric === GameMetric.MyTime ||
         effect.metric === GameMetric.Exp ||
         effect.metric === GameMetric.GenerateLeads)
        && effect.type === EffectType.Add && store) {
      // Apply directly to state
      if (effect.metric === GameMetric.Cash) {
        if (store.recordEventRevenue && store.recordEventExpense) {
          const sourceInfo: SourceInfo = SourceHelpers.fromMarketing(campaign.id, campaignName);
          if (effect.value >= 0) {
            store.recordEventRevenue(effect.value, sourceInfo, campaignName);
          } else {
            store.recordEventExpense(Math.abs(effect.value), sourceInfo, campaignName);
          }
        } else if (store.applyCashChange) {
          store.applyCashChange(effect.value);
        }
      } else if (effect.metric === GameMetric.MyTime) {
        // Use recordTimeSpent for negative values (time spent), applyTimeChange for positive (time gained)
        if (effect.value < 0 && store.recordTimeSpent) {
          const sourceInfo: SourceInfo = SourceHelpers.fromMarketing(campaign.id, campaignName);
          store.recordTimeSpent(effect.value, sourceInfo, campaignName);
        } else if (store.applyTimeChange) {
          store.applyTimeChange(effect.value);
        }
      } else if (effect.metric === GameMetric.Exp && store.applyExpChange) {
        store.applyExpChange(effect.value);
      } else if (effect.metric === GameMetric.GenerateLeads && store.spawnLead && store.updateLeads && store.getState && store.updateLeadProgress) {
        // Use shared lead generation utility (single source of truth)
        generateLeads(effect.value, {
          spawnLead: store.spawnLead,
          updateLeads: store.updateLeads,
          spawnCustomer: store.spawnCustomer,
          addCustomers: store.addCustomers,
          getState: store.getState,
          updateLeadProgress: store.updateLeadProgress,
        });
      }
      // Direct state metrics are always permanent (one-time add/subtract)
      // Duration is ignored for these metrics - content should not use temporary effects
      return;
    }
    
    // For other metrics or effect types, use effect manager
    effectManager.add({
      id: `marketing_${campaign.id}_${currentGameTime}_${index}`,
      source: {
        category: 'marketing',
        id: campaign.id,
        name: campaignName,
      },
      metric: effect.metric,
      type: effect.type,
      value: effect.value,
      durationMonths: effect.durationMonths,
    }, currentGameTime);
    
    // For direct state metrics with non-Add effects, calculate and apply the change
    if (store && (effect.metric === GameMetric.Cash || effect.metric === GameMetric.MyTime ||
                  effect.metric === GameMetric.Exp)) {
      // Get current values from store (would need to pass metrics or calculate)
      // For now, non-Add effects on direct state metrics go through effectManager
      // and would need to be applied elsewhere if needed
    }
  });
}

/**
 * Remove marketing campaign effects from the effect manager
 */
function removeMarketingEffects(campaignId: string): void {
  effectManager.removeBySource('marketing', campaignId);
}

const cloneCampaign = (campaign: MarketingCampaign): MarketingCampaign => ({
  ...campaign,
  effects: campaign.effects ? campaign.effects.map((effect) => ({ ...effect })) : undefined,
  levels: campaign.levels ? campaign.levels.map((level) => ({
    ...level,
    effects: level.effects.map((effect) => ({ ...effect })),
  })) : undefined,
});

const resolveCampaignBlueprints = (industryId: IndustryId): MarketingCampaign[] => {
  const configCampaigns = useConfigStore.getState().industryConfigs[industryId]?.marketingCampaigns;
  // Return campaigns from database only - no fallback to ensure we know when database is empty
  if (!configCampaigns || configCampaigns.length === 0) {
    return [];
  }
  return configCampaigns.map(cloneCampaign);
};

export const createMarketingSlice: StateCreator<GameStore, [], [], MarketingSlice> = (set, get) => ({
  campaignCooldowns: {},
  campaignLevels: {},
  campaignsActivatedThisMonth: new Set<string>(),

  getCampaignLevel: (campaignId: string) => {
    return get().campaignLevels[campaignId] || 0;
  },

  wasCampaignActivatedThisMonth: (campaignId: string) => {
    return get().campaignsActivatedThisMonth.has(campaignId);
  },

  resetMonthlyMarketingTracking: () => {
    set((state) => ({
      campaignsActivatedThisMonth: new Set<string>(),
    }));
  },

  startCampaign: (campaignId: string) => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const campaign = resolveCampaignBlueprints(industryId).find((item) => item.id === campaignId);
    if (!campaign) {
      return { success: false, message: 'Campaign not found.' };
    }

    const { campaignCooldowns, campaignLevels, gameTime } = get();

    // Check if campaign is on cooldown
    const existingCooldownEnd = campaignCooldowns[campaignId];
    if (existingCooldownEnd && gameTime < existingCooldownEnd) {
      const remainingSeconds = Math.ceil(existingCooldownEnd - gameTime);
      return { success: false, message: `${campaign.name} is on cooldown for ${Math.ceil(remainingSeconds / 60)} more minutes.` };
    }

    // Handle leveled campaigns (like upgrades)
    if (campaign.type === 'leveled') {
      if (!campaign.levels || campaign.levels.length === 0) {
        return { success: false, message: `${campaign.name} has no levels configured.` };
      }

      const currentLevel = campaignLevels[campaignId] || 0;
      const maxLevel = campaign.maxLevel || campaign.levels.length;

      if (currentLevel >= maxLevel) {
        return { success: false, message: `${campaign.name} is already at max level.` };
      }

      // Get next level config
      const nextLevelNumber = currentLevel + 1;
      const levelConfig = campaign.levels.find(l => l.level === nextLevelNumber) || campaign.levels[nextLevelNumber - 1];

      if (!levelConfig) {
        return { success: false, message: `Level ${nextLevelNumber} not found for ${campaign.name}.` };
      }

      const { metrics } = get();
      const needsCash = levelConfig.cost > 0;
      const needsTime = levelConfig.timeCost !== undefined && levelConfig.timeCost > 0;

      // Check affordability
      if (needsCash && metrics.cash < levelConfig.cost) {
        return { success: false, message: `Need $${levelConfig.cost} to purchase ${campaign.name} level ${nextLevelNumber}.` };
      }

      // Check myTime availability (marketing only uses personal time, not leveraged time)
      if (needsTime && metrics.myTime < levelConfig.timeCost!) {
        return { success: false, message: `Need ${levelConfig.timeCost}h personal time to purchase ${campaign.name} level ${nextLevelNumber}.` };
      }

      // Check requirements
      if (campaign.requirements && campaign.requirements.length > 0) {
        const store = get();
        const requirementsMet = checkRequirements(campaign.requirements, store);
        if (!requirementsMet) {
          return { success: false, message: `Requirements not met to purchase ${campaign.name}.` };
        }
      }

      // Deduct costs
      if (needsCash) {
        const { addOneTimeCost } = get();
        if (addOneTimeCost) {
          const sourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
          const costEntry: OneTimeCost = {
            label: `${campaign.name} - ${levelConfig.name}`,
            amount: levelConfig.cost,
            category: OneTimeCostCategory.Marketing,
            sourceId: sourceInfo.id,
            sourceType: sourceInfo.type,
            sourceName: sourceInfo.name,
          };
          addOneTimeCost(costEntry, { deductNow: true });
        }
      }

      if (needsTime) {
        const { recordMyTimeSpent } = get();
        if (recordMyTimeSpent) {
          const sourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
          recordMyTimeSpent(-levelConfig.timeCost!, sourceInfo, `${campaign.name} - ${levelConfig.name}`);
        }
      }

      // Remove old effects and add new level effects
      //NOTE: Remove this To change leveled campaigns to stacking:
      // removeMarketingEffects(campaignId);
      
      // Add effects for all levels from 1 to newLevel (effects accumulate)
      const store = get();
      const newLevel = nextLevelNumber;
      for (let level = 1; level <= newLevel; level++) {
        const levelCfg = campaign.levels.find(l => l.level === level) || campaign.levels[level - 1];
        if (levelCfg) {
          const levelName = `${campaign.name} - ${levelCfg.name}`;
          addMarketingEffects(campaign, levelCfg.effects, levelName, gameTime, {
            applyCashChange: store.applyCashChange,
            applyTimeChange: store.applyTimeChange,
            applyExpChange: store.applyExpChange,
            recordEventRevenue: store.recordEventRevenue,
            recordEventExpense: store.recordEventExpense,
            recordTimeSpent: store.recordTimeSpent,
            spawnLead: store.spawnLead,
            updateLeads: store.updateLeads,
            spawnCustomer: store.spawnCustomer,
            addCustomers: store.addCustomers,
            getState: () => get(),
            updateLeadProgress: (progress: number) => {
              set((state) => ({
                leadProgress: progress,
              }));
            },
          });
        }
      }

      // Update level
      set((state) => ({
        campaignLevels: {
          ...state.campaignLevels,
          [campaignId]: newLevel,
        },
      }));

      // Set flag if campaign sets one
      if (campaign.setsFlag) {
        get().setFlag(campaign.setsFlag, true);
      }

      // Mark campaign as activated this month
      set((state) => ({
        campaignsActivatedThisMonth: new Set([...state.campaignsActivatedThisMonth]).add(campaignId),
      }));

      // Start cooldown
      const cooldownEnd = gameTime + campaign.cooldownSeconds;
      set((state) => ({
        campaignCooldowns: {
          ...state.campaignCooldowns,
          [campaignId]: cooldownEnd,
        },
      }));

      return { success: true, message: `${campaign.name} level ${newLevel} purchased!` };
    }

    // Handle unlimited campaigns (original behavior)
    if (campaign.type === 'unlimited') {
      if (!campaign.effects || campaign.effects.length === 0) {
        return { success: false, message: `${campaign.name} has no effects configured.` };
      }

      const { metrics } = get();
      const needsCash = (campaign.cost ?? 0) > 0;
      const needsTime = campaign.timeCost !== undefined && campaign.timeCost > 0;

      // Check affordability
      if (needsCash && metrics.cash < (campaign.cost ?? 0)) {
        return { success: false, message: `Need $${campaign.cost} to launch ${campaign.name}.` };
      }

      // Check myTime availability (marketing only uses personal time, not leveraged time)
      if (needsTime && metrics.myTime < campaign.timeCost!) {
        return { success: false, message: `Need ${campaign.timeCost}h personal time to launch ${campaign.name}.` };
      }

      // Check requirements
      if (campaign.requirements && campaign.requirements.length > 0) {
        const store = get();
        const requirementsMet = checkRequirements(campaign.requirements, store);
        if (!requirementsMet) {
          return { success: false, message: `Requirements not met to launch ${campaign.name}.` };
        }
      }

      // Deduct costs
      if (needsCash) {
        const { addOneTimeCost } = get();
        if (addOneTimeCost) {
          const sourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
          const costEntry: OneTimeCost = {
            label: campaign.name,
            amount: campaign.cost!,
            category: OneTimeCostCategory.Marketing,
            sourceId: sourceInfo.id,
            sourceType: sourceInfo.type,
            sourceName: sourceInfo.name,
          };
          addOneTimeCost(costEntry, { deductNow: true });
        }
      }

      if (needsTime) {
        const { recordMyTimeSpent } = get();
        if (recordMyTimeSpent) {
          const sourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
          recordMyTimeSpent(-campaign.timeCost!, sourceInfo, campaign.name);
        }
      }

      //To change unlimited campaigns to overriding:
      //Add before line 391: removeMarketingEffects(campaignId);  
      
      // Register effects (effects from multiple launches will stack)
      const store = get();
      addMarketingEffects(campaign, campaign.effects, campaign.name, gameTime, {
        applyCashChange: store.applyCashChange,
        applyTimeChange: store.applyTimeChange,
        applyExpChange: store.applyExpChange,
        recordEventRevenue: store.recordEventRevenue,
        recordEventExpense: store.recordEventExpense,
        recordTimeSpent: store.recordTimeSpent,
        spawnLead: store.spawnLead,
        updateLeads: store.updateLeads,
        spawnCustomer: store.spawnCustomer,
        addCustomers: store.addCustomers,
        getState: () => get(),
        updateLeadProgress: (progress: number) => {
          set((state) => ({
            leadProgress: progress,
          }));
        },
      });

      // Set flag if campaign sets one
      if (campaign.setsFlag) {
        get().setFlag(campaign.setsFlag, true);
      }

      // Mark campaign as activated this month
      set((state) => ({
        campaignsActivatedThisMonth: new Set([...state.campaignsActivatedThisMonth]).add(campaignId),
      }));

      // Start cooldown
      const cooldownEnd = gameTime + campaign.cooldownSeconds;
      set((state) => ({
        campaignCooldowns: {
          ...state.campaignCooldowns,
          [campaignId]: cooldownEnd,
        },
      }));

      return { success: true };
    }

    return { success: false, message: `Invalid campaign type for ${campaign.name}.` };
  },

  tickMarketing: (currentGameTime: number) => {
    const { campaignCooldowns } = get();

    // Clean up expired cooldowns
    const expiredCooldowns = Object.keys(campaignCooldowns).filter(
      campaignId => campaignCooldowns[campaignId] <= currentGameTime
    );

    if (expiredCooldowns.length > 0) {
      set((state) => {
        const newCooldowns = { ...state.campaignCooldowns };
        expiredCooldowns.forEach(id => delete newCooldowns[id]);
        return { campaignCooldowns: newCooldowns };
      });
    }
  },

  resetMarketing: () => {
    // Clear all marketing effects
    effectManager.clearCategory('marketing');
    set({
      campaignCooldowns: {},
      campaignLevels: {},
      campaignsActivatedThisMonth: new Set<string>(),
    });
  },

  resetMarketingLevels: () => {
    // Reset campaign levels to 0, but keep effects active (they will expire naturally)
    set({
      campaignLevels: {},
    });
  },
});
