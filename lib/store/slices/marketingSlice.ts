import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { OneTimeCost, OneTimeCostCategory } from '../types';
import { effectManager, GameMetric, EffectType, Effect } from '@/lib/game/effectManager';

// Marketing campaign effect (simplified from full Effect, no ID/source yet)
export interface CampaignEffect {
  metric: GameMetric;
  type: EffectType;
  value: number;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  cost: number;
  durationSeconds: number;
  effects: CampaignEffect[];
}

export interface MarketingSlice {
  activeCampaign: MarketingCampaign | null;
  campaignStartedAt: number | null;
  campaignEndsAt: number | null;
  availableCampaigns: MarketingCampaign[];
  startCampaign: (campaignId: string) => { success: boolean; message: string };
  stopCampaign: () => void;
  tickMarketing: (currentGameTime: number) => void;
  resetMarketing: () => void;
}

/**
 * Add marketing campaign effects to the effect manager
 */
function addMarketingEffects(campaign: MarketingCampaign): void {
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
    });
  });
}

/**
 * Remove marketing campaign effects from the effect manager
 */
function removeMarketingEffects(campaignId: string): void {
  effectManager.removeBySource('marketing', campaignId);
}

// Note: percent values now use whole numbers (e.g., 100 = +100%)
const DEFAULT_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'neighborhood-flyers',
    name: 'Neighborhood Flyers',
    description: 'Hand out flyers and offer a same-day discount to nearby offices.',
    cost: 150,
    durationSeconds: 20,
    effects: [
      {
        metric: GameMetric.SpawnIntervalSeconds,
        type: EffectType.Add,
        value: -1, // -1s spawn = faster customer flow
      },
    ],
  },
  {
    id: 'community-open-house',
    name: 'Community Open House',
    description: 'Host a monthend open house with free mini check-ups and swag.',
    cost: 200,
    durationSeconds: 30,
    effects: [
      {
        metric: GameMetric.ReputationMultiplier,
        type: EffectType.Percent,
        value: 200, // +200% reputation gain
      },
    ],
  },
  {
    id: 'digital-ad-burst',
    name: 'Digital Ad Burst',
    description: 'Launch a short social media blitz to boost incoming customers.',
    cost: 240,
    durationSeconds: 24,
    effects: [
      {
        metric: GameMetric.SpawnIntervalSeconds,
        type: EffectType.Percent,
        value: 100, // +100% spawn speed = 2x customer flow
      },
      {
        metric: GameMetric.MonthlyExpenses,
        type: EffectType.Add,
        value: 300, // +$300 expenses while active
      },
    ],
  },
  {
    id: 'vip-weekend',
    name: 'VIP Weekend',
    description: 'Bundle premium services for high-value patients.',
    cost: 360,
    durationSeconds: 26,
    effects: [
      {
        metric: GameMetric.ServiceRevenueFlatBonus,
        type: EffectType.Add,
        value: 80, // +$80 per completed service
      },
    ],
  },
  {
    id: 'revenue-multiplier-test',
    name: 'Revenue Multiplier Test',
    description: 'A test campaign to boost service revenue by a multiplier.',
    cost: 400,
    durationSeconds: 25,
    effects: [
      {
        metric: GameMetric.ServiceRevenueMultiplier,
        type: EffectType.Multiply,
        value: 1.5, // +50% service revenue
      },
    ],
  },
  {
    id: 'express-checkin',
    name: 'Express Check-in',
    description: 'Bring in temporary staff to keep chairs turning quickly.',
    cost: 320,
    durationSeconds: 22,
    effects: [
      {
        metric: GameMetric.ServiceSpeedMultiplier,
        type: EffectType.Multiply,
        value: 1.25, // ×1.25 service speed
      },
      {
        metric: GameMetric.ServiceRooms,
        type: EffectType.Add,
        value: 1, // +1 temporary service room
      },
    ],
  },
];

export const getInitialMarketingState = (): Pick<
  MarketingSlice,
  'activeCampaign' | 'campaignStartedAt' | 'campaignEndsAt' | 'availableCampaigns'
> => ({
  activeCampaign: null,
  campaignStartedAt: null,
  campaignEndsAt: null,
  availableCampaigns: DEFAULT_CAMPAIGNS.map((campaign) => ({
    ...campaign,
    effects: campaign.effects.map((effect) => ({ ...effect })),
  })),
});

export const createMarketingSlice: StateCreator<GameStore, [], [], MarketingSlice> = (set, get) => ({
  ...getInitialMarketingState(),

  startCampaign: (campaignId: string) => {
    const campaign = get().availableCampaigns.find((item) => item.id === campaignId);
    if (!campaign) {
      return { success: false, message: 'Campaign not found.' };
    }

    const currentCampaign = get().activeCampaign;
    if (currentCampaign) {
      if (currentCampaign.id === campaignId) {
        return { success: false, message: `${campaign.name} is already running.` };
      }
      return { success: false, message: `${currentCampaign.name} is already in progress.` };
    }

    const { metrics } = get();
    if (metrics.cash < campaign.cost) {
      return { success: false, message: `Need $${campaign.cost} to launch ${campaign.name}.` };
    }

    const { addOneTimeCost } = get();

    if (addOneTimeCost) {
      const costEntry: OneTimeCost = {
        label: campaign.name,
        amount: campaign.cost,
        category: OneTimeCostCategory.Marketing,
      };
      addOneTimeCost(costEntry, { deductNow: true });
    }

    const campaignStartedAt = get().gameTime ?? 0;
    const campaignEndsAt = campaignStartedAt + campaign.durationSeconds;

    // Register effects to effectManager
    addMarketingEffects(campaign);

    set({
      activeCampaign: campaign,
      campaignStartedAt,
      campaignEndsAt,
    });

    return { success: true, message: `${campaign.name} launched!` };
  },

  stopCampaign: () => {
    const { activeCampaign } = get();
    if (!activeCampaign) {
      return;
    }

    // Remove effects from effectManager
    removeMarketingEffects(activeCampaign.id);

    set({
      activeCampaign: null,
      campaignStartedAt: null,
      campaignEndsAt: null,
    });
  },

  tickMarketing: (currentGameTime: number) => {
    const { activeCampaign, campaignEndsAt } = get();
    if (!activeCampaign || campaignEndsAt == null) {
      return;
    }

    if (currentGameTime >= campaignEndsAt) {
      // Remove effects from effectManager
      removeMarketingEffects(activeCampaign.id);

      set({
        activeCampaign: null,
        campaignStartedAt: null,
        campaignEndsAt: null,
      });
    }
  },

  resetMarketing: () => {
    const { activeCampaign } = get();
    if (activeCampaign) {
      removeMarketingEffects(activeCampaign.id);
    }
    effectManager.clearCategory('marketing');
    set(getInitialMarketingState());
  },
});
