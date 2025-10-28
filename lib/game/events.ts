import { GameEvent } from "../types/gameEvents";
import { EffectType, GameMetric } from "./effectManager";

//TODO: Why this is not in Config
export const sampleEvents: GameEvent[] = [
  {
    id: 'food-blog-feature',
    title: 'Neighborhood Food Blog',
    category: 'opportunity',
    summary: 'A popular neighborhood blogger wants to spotlight your business for this week’s feature.',
    choices: [
      {
        id: 'decline-invite',
        label: 'Stick to Regular Service',
        description: 'Thank them for the offer but keep the team focused on day-to-day guests.',
        consequences: [
          {
            id: 'steady-week',
            label: 'Steady Week',
            weight: 100,
            effects: [],
          },
        ],
      },
      {
        id: 'host-tasting',
        label: 'Host a Tasting Night',
        description: 'Close the dining room for an evening and serve a curated menu for the blogger.',
        cost: 100,
        consequences: [
          {
            id: 'rave-review',
            label: 'Rave Review',
            description: 'The blogger’s write-up goes viral in the neighborhood.',
            weight: 65,
            effects: [
              { type: 'cash', amount: 320 },
              { type: 'reputation', amount: 4 },
            ],
            temporaryEffects: [
              {
                metric: GameMetric.ServiceRevenueMultiplier,
                type: EffectType.Percent,
                value: 20,
                durationSeconds: 45,
              },
            ],
          },
          {
            id: 'lukewarm-review',
            label: 'Lukewarm Mention',
            description: 'The post is polite but doesn’t wow readers.',
            weight: 35,
            effects: [
              { type: 'cash', amount: 120 },
              { type: 'reputation', amount: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'refrigeration-breakdown',
    title: 'Refrigeration Breakdown',
    category: 'risk',
    summary: 'Your walk-in fridge fails overnight, putting tomorrow’s prep at risk.',
    choices: [
      {
        id: 'limited-menu',
        label: 'Serve a Limited Menu',
        description: 'Keep doors open with shelf-stable dishes while you sort it out.',
        consequences: [
          {
            id: 'customers-frustrated',
            label: 'Customers Frustrated',
            description: 'Regulars miss their favorites and leave harsh reviews.',
            weight: 100,
            effects: [
              { type: 'reputation', amount: -4 },
            ],
          },
        ],
      },
      {
        id: 'rush-technician',
        label: 'Rush Emergency Repair',
        description: 'Pay a premium to get your preferred technician on site immediately.',
        cost: 350,
        consequences: [
          {
            id: 'same-day-fix',
            label: 'Same-Day Fix',
            description: 'The tech replaces a faulty relay before opening time.',
            weight: 60,
            effects: [
              { type: 'reputation', amount: 3 },
            ],
            temporaryEffects: [
              {
                metric: GameMetric.ServiceSpeedMultiplier,
                type: EffectType.Percent,
                value: 20,
                durationSeconds: 45,
              },
            ],
          },
          {
            id: 'parts-delay',
            label: 'Parts on Backorder',
            description: 'Repairs start, but you pay extra to overnight the missing part.',
            weight: 30,
            effects: [
              { type: 'cash', amount: -200 },
              { type: 'reputation', amount: 1 },
            ],
          },
          {
            id: 'extended-downtime',
            label: 'Extended Downtime',
            description: 'A deeper issue keeps the fridge offline longer than expected.',
            weight: 10,
            effects: [
              { type: 'reputation', amount: -2 },
            ],
          },
        ],
      },
      {
        id: 'borrow-storage',
        label: 'Borrow Storage From Neighbor',
        description: 'Rent fridge space from a friendly café down the street.',
        cost: 100,
        consequences: [
          {
            id: 'favor-returned',
            label: 'Favor Returned',
            description: 'They make space and shout you out to their followers.',
            weight: 40,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
            temporaryEffects: [
              {
                metric: GameMetric.MonthlyExpenses,
                type: EffectType.Add,
                value: 50,
                durationSeconds: 60,
              },
            ],
          },
          {
            id: 'tight-fit',
            label: 'Tight Fit',
            description: 'Space is cramped, forcing you to toss some ingredients.',
            weight: 35,
            effects: [
              { type: 'cash', amount: -80 },
            ],
          },
          {
            id: 'sudden-inspection',
            label: 'Surprise Inspection',
            description: 'A health inspector questions the offsite storage plan.',
            weight: 25,
            effects: [
              { type: 'reputation', amount: -3 },
              { type: 'cash', amount: -120 },
            ],
            temporaryEffects: [
              {
                metric: GameMetric.ReputationMultiplier,
                type: EffectType.Percent,
                value: -10,
                durationSeconds: 45,
              },
            ],
          },
        ],
      },
    ],
  },
];
