import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { OneTimeCost } from '../types';
import { UpgradeEffect } from '@/lib/game/config';

export type MarketingEffects = UpgradeEffect[];

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  cost: number;
  durationSeconds: number;
  effects: UpgradeEffect[];
}

export interface MarketingSlice {
  activeCampaign: MarketingCampaign | null;
  campaignStartedAt: number | null;
  campaignEndsAt: number | null;
  marketingEffects: MarketingEffects;
  availableCampaigns: MarketingCampaign[];
  startCampaign: (campaignId: string) => { success: boolean; message: string };
  stopCampaign: () => void;
  tickMarketing: (currentGameTime: number) => void;
}

export const BASE_MARKETING_EFFECTS: MarketingEffects = [];

// Note: percent values use the shared upgrade convention (e.g., 1 = +100% multiplier).
const DEFAULT_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'neighborhood-flyers',
    name: 'Neighborhood Flyers',
    description: 'Hand out flyers and offer a same-day discount to nearby offices.',
    cost: 150,
    durationSeconds: 20,
    effects: [
      { metric: 'spawnIntervalSeconds', type: 'add', value: -1, source: 'Neighborhood Flyers' }, // Flow +~1 customer/minute
    ],
  },
  {
    id: 'community-open-house',
    name: 'Community Open House',
    description: 'Host a weekend open house with free mini check-ups and swag.',
    cost: 200,
    durationSeconds: 30,
    effects: [
      { metric: 'reputationMultiplier', type: 'percent', value: 1, source: 'Community Open House' }, // Reputation ×2.0
    ],
  },
  {
    id: 'limited-time-promo',
    name: 'Limited-Time Promo',
    description: 'Blast a flash promotion across social channels to fill the schedule.',
    cost: 260,
    durationSeconds: 25,
    effects: [
      { metric: 'spawnIntervalSeconds', type: 'percent', value: -0.5, source: 'Limited-Time Promo' }, // Flow ×2.0
    ],
  },
  {
    id: 'influencer-blitz',
    name: 'Influencer Blitz',
    description: 'Sponsor a local influencer for a two-day spotlight on your clinic.',
    cost: 420,
    durationSeconds: 30,
    effects: [
      { metric: 'reputationMultiplier', type: 'percent', value: 2, source: 'Influencer Blitz' },
    ],
  },
];

export const createMarketingSlice: StateCreator<GameStore, [], [], MarketingSlice> = (set, get) => ({
  activeCampaign: null,
  campaignStartedAt: null,
  campaignEndsAt: null,
  marketingEffects: BASE_MARKETING_EFFECTS,
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

    const { applyCashChange, addOneTimeCost } = get();

    if (addOneTimeCost) {
      const costEntry: OneTimeCost = {
        label: campaign.name,
        amount: campaign.cost,
        category: 'marketing',
        alreadyDeducted: true,
      };
      addOneTimeCost(costEntry, true);
    }

    if (applyCashChange) {
      applyCashChange(-campaign.cost);
    }

    const campaignStartedAt = get().gameTime ?? 0;
    const campaignEndsAt = campaignStartedAt + campaign.durationSeconds;

    set({
      activeCampaign: campaign,
      campaignStartedAt,
      campaignEndsAt,
      marketingEffects: campaign.effects.map((effect) => ({ ...effect })),
    });

    return { success: true, message: `${campaign.name} launched!` };
  },

  stopCampaign: () => {
    if (!get().activeCampaign) {
      return;
    }

    set({
      activeCampaign: null,
      campaignStartedAt: null,
      campaignEndsAt: null,
      marketingEffects: [],
    });
  },

  tickMarketing: (currentGameTime: number) => {
    const { activeCampaign, campaignEndsAt } = get();
    if (!activeCampaign || campaignEndsAt == null) {
      return;
    }

    if (currentGameTime >= campaignEndsAt) {
      set({
        activeCampaign: null,
        campaignStartedAt: null,
        campaignEndsAt: null,
        marketingEffects: [],
      });
    }
  },
});
