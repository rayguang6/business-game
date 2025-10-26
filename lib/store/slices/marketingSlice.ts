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
    description: 'Host a weekend open house with free mini check-ups and swag.',
    cost: 200,
    durationSeconds: 30,
    effects: [
      {
        metric: GameMetric.ReputationMultiplier,
        type: EffectType.Percent,
        value: 100, // +100% reputation gain
      },
    ],
  },
  {
    id: 'limited-time-promo',
    name: 'Limited-Time Promo',
    description: 'Blast a flash promotion across social channels to fill the schedule.',
    cost: 260,
    durationSeconds: 25,
    effects: [
      {
        metric: GameMetric.SpawnIntervalSeconds,
        type: EffectType.Percent,
        value: -50, // -50% spawn interval = 2x customer flow
      },
    ],
  },
  {
    id: 'influencer-blitz',
    name: 'Influencer Blitz',
    description: 'Sponsor a local influencer for a two-day spotlight on your clinic.',
    cost: 420,
    durationSeconds: 30,
    effects: [
      {
        metric: GameMetric.ReputationMultiplier,
        type: EffectType.Percent,
        value: 200, // +200% reputation gain
      },
    ],
  },
];

export const createMarketingSlice: StateCreator<GameStore, [], [], MarketingSlice> = (set, get) => ({
  activeCampaign: null,
  campaignStartedAt: null,
  campaignEndsAt: null,
  availableCampaigns: DEFAULT_CAMPAIGNS,

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
});
