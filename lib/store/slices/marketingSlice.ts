import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { OneTimeCost, OneTimeCostCategory } from '../types';
import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import { checkRequirements } from '@/lib/game/requirementChecker';
import type { Requirement, IndustryId } from '@/lib/game/types';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { useConfigStore } from '@/lib/store/configStore';
import type { Customer } from '@/lib/features/customers';

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
}

export interface MarketingSlice {
  campaignCooldowns: Record<string, number>; // campaignId -> cooldownEndTime
  startCampaign: (campaignId: string) => { success: boolean; message: string };
  tickMarketing: (currentGameTime: number) => void;
  resetMarketing: () => void;
}

/**
 * Add marketing campaign effects to the effect manager
 * For direct state metrics (Cash, Time, SkillLevel, FreedomScore, SpawnCustomers), apply directly
 */
function addMarketingEffects(campaign: MarketingCampaign, currentGameTime: number, store?: {
  applyCashChange?: (amount: number) => void;
  applyTimeChange?: (amount: number) => void;
  applySkillLevelChange?: (amount: number) => void;
  applyFreedomScoreChange?: (amount: number) => void;
  recordEventRevenue?: (amount: number, label?: string) => void;
  recordEventExpense?: (amount: number, label: string) => void;
  spawnCustomer?: () => Customer;
  addCustomers?: (customers: Customer[]) => void;
}): void {
  campaign.effects.forEach((effect, index) => {
    // Direct state metrics (Cash, Time, SkillLevel, FreedomScore, SpawnCustomers) with Add effects are applied directly
    // These are one-time permanent effects (no duration tracking)
    if ((effect.metric === GameMetric.Cash || effect.metric === GameMetric.Time || 
         effect.metric === GameMetric.SkillLevel || effect.metric === GameMetric.FreedomScore ||
         effect.metric === GameMetric.SpawnCustomers) 
        && effect.type === EffectType.Add && store) {
      // Apply directly to state
      if (effect.metric === GameMetric.Cash) {
        if (store.recordEventRevenue && store.recordEventExpense) {
          if (effect.value >= 0) {
            store.recordEventRevenue(effect.value, campaign.name);
          } else {
            store.recordEventExpense(Math.abs(effect.value), campaign.name);
          }
        } else if (store.applyCashChange) {
          store.applyCashChange(effect.value);
        }
      } else if (effect.metric === GameMetric.Time && store.applyTimeChange) {
        store.applyTimeChange(effect.value);
      } else if (effect.metric === GameMetric.SkillLevel && store.applySkillLevelChange) {
        store.applySkillLevelChange(effect.value);
      } else if (effect.metric === GameMetric.FreedomScore && store.applyFreedomScoreChange) {
        store.applyFreedomScoreChange(effect.value);
      } else if (effect.metric === GameMetric.SpawnCustomers && store.spawnCustomer && store.addCustomers) {
        // Spawn customers with staggered animation - value is the number of customers to spawn
        const count = Math.max(0, Math.floor(effect.value));
        
        if (count > 0) {
          // Stagger customer spawns with a slight delay for better visual effect
          // No position offset to avoid alignment issues with chairs and pathfinding
          const spawnDelayMs = 150; // 150ms delay between each customer spawn
          
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              if (!store.spawnCustomer || !store.addCustomers) return;
              
              const customer = store.spawnCustomer();
              store.addCustomers([customer]);
              
              // Last customer spawned
            }, i * spawnDelayMs);
          }
        }
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
    if (store && (effect.metric === GameMetric.Cash || effect.metric === GameMetric.Time || 
                  effect.metric === GameMetric.SkillLevel || effect.metric === GameMetric.FreedomScore)) {
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
    
    if (needsTime && metrics.time < campaign.timeCost!) {
      return { success: false, message: `Need ${campaign.timeCost}h to launch ${campaign.name}.` };
    }
    
    // If both are needed, check both
    if (needsCash && needsTime && (metrics.cash < campaign.cost || metrics.time < campaign.timeCost!)) {
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
        const costEntry: OneTimeCost = {
          label: campaign.name,
          amount: campaign.cost,
          category: OneTimeCostCategory.Marketing,
        };
        addOneTimeCost(costEntry, { deductNow: true });
      }
    }
    
    if (needsTime) {
      set((state) => ({
        metrics: {
          ...state.metrics,
          time: state.metrics.time - campaign.timeCost!,
        },
      }));
    }

    // Register effects to effectManager (expiration handled automatically)
    // For direct state metrics, apply them directly
    const store = get();
    addMarketingEffects(campaign, gameTime, {
      applyCashChange: store.applyCashChange,
      applyTimeChange: store.applyTimeChange,
      applySkillLevelChange: store.applySkillLevelChange,
      applyFreedomScoreChange: store.applyFreedomScoreChange,
      recordEventRevenue: store.recordEventRevenue,
      recordEventExpense: store.recordEventExpense,
      spawnCustomer: store.spawnCustomer,
      addCustomers: (customers: Customer[]) => {
        set((state) => ({
          customers: [...state.customers, ...customers],
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

    return { success: true, message: `${campaign.name} launched!` };
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
