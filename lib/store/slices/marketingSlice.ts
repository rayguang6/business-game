import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { OneTimeCost, OneTimeCostCategory } from '../types';
import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import { checkRequirements } from '@/lib/game/requirementChecker';
import type { Requirement, IndustryId } from '@/lib/game/types';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { useConfigStore } from '@/lib/store/configStore';

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
 */
function addMarketingEffects(campaign: MarketingCampaign, currentGameTime: number): void {
  campaign.effects.forEach((effect, index) => {
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
  });
}

/**
 * Remove marketing campaign effects from the effect manager
 */
function removeMarketingEffects(campaignId: string): void {
  effectManager.removeBySource('marketing', campaignId);
}

// Note: percent values now use whole numbers (e.g., 100 = +100%)
export const FALLBACK_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'neighborhood-flyers',
    name: 'Neighborhood Flyers',
    description: 'Hand out flyers and offer a same-day discount to nearby offices.',
    cost: 150,
    cooldownSeconds: 10, // 10 seconds cooldown
    effects: [
      {
        metric: GameMetric.SpawnIntervalSeconds,
        type: EffectType.Add,
        value: -1, // reduce spawn interval by 1 second
        durationSeconds: 30, // 30 seconds effect
      },
    ],
  },
  {
    id: 'community-open-house',
    name: 'Community Open House',
    description: 'Host a monthend open house with free mini check-ups and swag.',
    cost: 200,
    cooldownSeconds: 15, // 15 seconds cooldown
    effects: [
      {
        metric: GameMetric.ReputationMultiplier,
        type: EffectType.Percent,
        value: 200, // +200% reputation gain
        durationSeconds: 45, // 45 seconds effect
      },
    ],
  },
  {
    id: 'digital-ad-burst',
    name: 'Digital Ad Burst',
    description: 'Launch a short social media blitz to boost incoming customers.',
    cost: 240,
    cooldownSeconds: 12, // 12 seconds cooldown
    effects: [
      {
        metric: GameMetric.SpawnIntervalSeconds,
        type: EffectType.Percent,
        value: 100, // double the spawn speed (interval ÷ 2)
        durationSeconds: 35, // 35 seconds effect
      },
      {
        metric: GameMetric.MonthlyExpenses,
        type: EffectType.Add,
        value: 300, // +$300 expenses while active
        durationSeconds: 35, // 35 seconds effect
      },
    ],
  },
  {
    id: 'vip-weekend',
    name: 'VIP Weekend',
    description: 'Bundle premium services for high-value patients.',
    cost: 360,
    cooldownSeconds: 20, // 20 seconds cooldown
    effects: [
      {
        metric: GameMetric.ServiceRevenueFlatBonus,
        type: EffectType.Add,
        value: 80, // add $80 to each service
        durationSeconds: 40, // 40 seconds effect
      },
    ],
  },
  {
    id: 'revenue-multiplier-test',
    name: 'Revenue Multiplier Test',
    description: 'A test campaign to boost service revenue by a multiplier.',
    cost: 400,
    cooldownSeconds: 25, // 25 seconds cooldown
    effects: [
      {
        metric: GameMetric.ServiceRevenueMultiplier,
        type: EffectType.Multiply,
        value: 1.5, // multiply service revenue by 1.5
        durationSeconds: 50, // 50 seconds effect
      },
    ],
  },
  {
    id: 'express-checkin',
    name: 'Express Check-in',
    description: 'Bring in temporary staff to keep chairs turning quickly.',
    cost: 320,
    cooldownSeconds: 18, // 18 seconds cooldown
    effects: [
      {
        metric: GameMetric.ServiceSpeedMultiplier,
        type: EffectType.Multiply,
        value: 1.25, // speed up service by 25%
        durationSeconds: 32, // 32 seconds effect
      },
      {
        metric: GameMetric.ServiceRooms,
        type: EffectType.Add,
        value: 1, // add one temporary service room
        durationSeconds: 32, // 32 seconds effect
      },
    ],
  },
];

const cloneCampaign = (campaign: MarketingCampaign): MarketingCampaign => ({
  ...campaign,
  effects: campaign.effects.map((effect) => ({ ...effect })),
});

const resolveCampaignBlueprints = (industryId: IndustryId): MarketingCampaign[] => {
  const configCampaigns = useConfigStore.getState().industryConfigs[industryId]?.marketingCampaigns;
  const source = configCampaigns && configCampaigns.length > 0 ? configCampaigns : FALLBACK_CAMPAIGNS;
  return source.map(cloneCampaign);
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
    addMarketingEffects(campaign, gameTime);

    // Set flag if campaign sets one
    if (campaign.setsFlag) {
      get().setFlag(campaign.setsFlag, true);
      console.log(`[Flag System] Flag "${campaign.setsFlag}" set to true by marketing campaign "${campaign.name}"`);
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
