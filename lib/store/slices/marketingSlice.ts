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
  durationSeconds?: number | null; // null = permanent, number = expires after seconds
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  cost: number; // Cash cost (or time cost if timeCost is specified)
  timeCost?: number; // Optional time cost (hours) - if specified, uses time instead of cash
  cooldownSeconds: number; // How long before this campaign can be run again
  effects: CampaignEffect[];
  setsFlag?: string; // Optional flag to set when campaign is launched
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
  order?: number; // Display order (lower = shown first, defaults to 0)
}

export interface MarketingSlice {
  campaignCooldowns: Record<string, number>; // campaignId -> cooldownEndTime
  startCampaign: (campaignId: string) => { success: boolean; message?: string };
  tickMarketing: (currentGameTime: number) => void;
  resetMarketing: () => void;
}

/**
 * Add marketing campaign effects to the effect manager
 * For direct state metrics (Cash, Time, SkillLevel, GenerateLeads), apply directly
 */
function addMarketingEffects(campaign: MarketingCampaign, currentGameTime: number, store?: {
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
}): void {
  campaign.effects.forEach((effect, index) => {
    // Direct state metrics (Cash, Time, SkillLevel, GenerateLeads) with Add effects are applied directly
    // These are one-time permanent effects (no duration tracking)
    if ((effect.metric === GameMetric.Cash || effect.metric === GameMetric.MyTime ||
         effect.metric === GameMetric.Exp ||
         effect.metric === GameMetric.GenerateLeads)
        && effect.type === EffectType.Add && store) {
      // Apply directly to state
      if (effect.metric === GameMetric.Cash) {
        if (store.recordEventRevenue && store.recordEventExpense) {
          const sourceInfo: SourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
          if (effect.value >= 0) {
            store.recordEventRevenue(effect.value, sourceInfo, campaign.name);
          } else {
            store.recordEventExpense(Math.abs(effect.value), sourceInfo, campaign.name);
          }
        } else if (store.applyCashChange) {
          store.applyCashChange(effect.value);
        }
      } else if (effect.metric === GameMetric.MyTime) {
        // Use recordTimeSpent for negative values (time spent), applyTimeChange for positive (time gained)
        if (effect.value < 0 && store.recordTimeSpent) {
          const sourceInfo: SourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
          store.recordTimeSpent(effect.value, sourceInfo, campaign.name);
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
      id: `marketing_${campaign.id}_${index}`,
      source: {
        category: 'marketing',
        id: campaign.id,
        name: campaign.name,
      },
      metric: effect.metric,
      type: effect.type,
      value: effect.value,
      durationSeconds: effect.durationSeconds,
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
  effects: campaign.effects.map((effect) => ({ ...effect })),
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

  startCampaign: (campaignId: string) => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const campaign = resolveCampaignBlueprints(industryId).find((item) => item.id === campaignId);
    if (!campaign) {
      return { success: false, message: 'Campaign not found.' };
    }

    const { campaignCooldowns, gameTime } = get();

    // Check if campaign is on cooldown
    const existingCooldownEnd = campaignCooldowns[campaignId];
    if (existingCooldownEnd && gameTime < existingCooldownEnd) {
      const remainingSeconds = Math.ceil(existingCooldownEnd - gameTime);
      return { success: false, message: `${campaign.name} is on cooldown for ${Math.ceil(remainingSeconds / 60)} more minutes.` };
    }

    const { metrics } = get();
    const needsCash = campaign.cost > 0;
    const needsTime = campaign.timeCost !== undefined && campaign.timeCost > 0;
    
    // Check affordability for both cash and time costs
    if (needsCash && metrics.cash < campaign.cost) {
      return { success: false, message: `Need $${campaign.cost} to launch ${campaign.name}.` };
    }
    
    const totalAvailableTime = metrics.myTime + metrics.leveragedTime;
    if (needsTime && totalAvailableTime < campaign.timeCost!) {
      return { success: false, message: `Need ${campaign.timeCost}h to launch ${campaign.name}.` };
    }
    
    // If both are needed, check both
    if (needsCash && needsTime && (metrics.cash < campaign.cost || totalAvailableTime < campaign.timeCost!)) {
      return { success: false, message: `Need $${campaign.cost} and ${campaign.timeCost}h to launch ${campaign.name}.` };
    }

    // Check requirements
    if (campaign.requirements && campaign.requirements.length > 0) {
      const store = get();
      const requirementsMet = checkRequirements(campaign.requirements, store);
      if (!requirementsMet) {
        return { success: false, message: `Requirements not met to launch ${campaign.name}.` };
      }
    }

    // Deduct both cash and time if both are required
    if (needsCash) {
      const { addOneTimeCost } = get();
      if (addOneTimeCost) {
        const sourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
        const costEntry: OneTimeCost = {
          label: campaign.name,
          amount: campaign.cost,
          category: OneTimeCostCategory.Marketing,
          sourceId: sourceInfo.id,
          sourceType: sourceInfo.type,
          sourceName: sourceInfo.name,
        };
        addOneTimeCost(costEntry, { deductNow: true });
      }
    }
    
    if (needsTime) {
      const { recordTimeSpent } = get();
      if (recordTimeSpent) {
        const sourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
        recordTimeSpent(-campaign.timeCost!, sourceInfo, campaign.name);
      }
    }

    // Register effects to effectManager (expiration handled automatically)
    // For direct state metrics, apply them directly
    const store = get();
    addMarketingEffects(campaign, gameTime, {
      applyCashChange: store.applyCashChange,
      applyTimeChange: store.applyTimeChange,
      applyExpChange: store.applyExpChange,
      recordEventRevenue: store.recordEventRevenue,
      recordEventExpense: store.recordEventExpense,
      recordTimeSpent: store.recordTimeSpent,
      spawnLead: store.spawnLead,
      updateLeads: store.updateLeads,
      spawnCustomer: store.spawnCustomer,
      addCustomers: store.addCustomers, // Use store method which properly handles customer tracking
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

    // Start cooldown immediately
    const cooldownEnd = gameTime + campaign.cooldownSeconds;

    set((state) => ({
      campaignCooldowns: {
        ...state.campaignCooldowns,
        [campaignId]: cooldownEnd,
      },
    }));

    return { success: true };
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
    });
  },
});
