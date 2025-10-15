import { GameEvent } from "../types/gameEvents";

//TODO: Why this is not in Config
export const sampleEvents: GameEvent[] = [
  {
    id: 'influencer-shoutout',
    title: 'Influencer Shoutout',
    category: 'opportunity',
    summary: 'A local influencer wants to feature your business.',
    choices: [
      {
        id: 'accept',
        label: 'Accept Shoutout',
        description: 'You agree to the collaboration and gain exposure.',
        effects: [
          { type: 'cash', amount: 300 }, // sales increase
          { type: 'reputation', amount: 5 },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore Offer',
        description: 'You stay low-key and keep business as usual.',
        effects: [],
        isDefault: true,
      },
    ],
  },

  {
    id: 'equipment-malfunction',
    title: 'Equipment Malfunction',
    category: 'risk',
    summary: 'One of your key machines breaks down mid-day.',
    choices: [
      {
        id: 'repair',
        label: 'Repair Immediately',
        description: 'Fix it quickly to avoid upsetting customers.',
        effects: [
          { type: 'cash', amount: -300 },
          { type: 'reputation', amount: 2 },
        ],
      },
      {
        id: 'delay',
        label: 'Delay Repairs',
        description: 'Save money now, but risk unhappy customers.',
        effects: [
          { type: 'cash', amount: -100 },
          { type: 'reputation', amount: -4 },
        ],
        isDefault: true,
      },
    ],
  },

  {
    id: 'unexpected-inspection',
    title: 'Unexpected Inspection',
    category: 'risk',
    summary: 'A health inspector shows up without warning.',
    choices: [
      {
        id: 'comply',
        label: 'Comply Honestly',
        description: 'You take the hit but maintain integrity.',
        effects: [
          { type: 'cash', amount: -200 },
          { type: 'reputation', amount: 2 },
        ],
        isDefault: true,
      },
      {
        id: 'cut-corners',
        label: 'Cut Corners',
        description: 'Try to hide issues and hope they don’t notice.',
        effects: [
          { type: 'cash', amount: -50 },
          { type: 'reputation', amount: -4 },
        ],
      },
    ],
  },

  {
    id: 'local-festival',
    title: 'Local Festival',
    category: 'opportunity',
    summary: 'A big festival nearby brings more people to your area.',
    choices: [
      {
        id: 'take-advantage',
        label: 'Join the Festival',
        description: 'Offer promotions and attract festival-goers.',
        effects: [
          { type: 'cash', amount: 800 },
          { type: 'reputation', amount: 3 },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore Festival',
        description: 'Stay focused on regular customers.',
        effects: [],
        isDefault: true,
      },
    ],
  },

  {
    id: 'celebrity-visit',
    title: 'Celebrity Visit',
    category: 'opportunity',
    summary: 'A local celebrity drops by unexpectedly!',
    choices: [
      {
        id: 'welcome',
        label: 'Welcome Warmly',
        description: 'Provide great service — word spreads fast.',
        effects: [
          { type: 'cash', amount: 400 },
          { type: 'reputation', amount: 6 },
        ],
        isDefault: true,
      },
    ], // single choice event
  },

  {
    id: 'negative-review',
    title: 'Negative Review',
    category: 'risk',
    summary: 'A dissatisfied customer posts a bad review online.',
    choices: [
      {
        id: 'respond-politely',
        label: 'Respond Politely',
        description: 'Apologize and offer compensation.',
        effects: [
          { type: 'cash', amount: -100 },
          { type: 'reputation', amount: 2 },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore Review',
        description: 'Do nothing and let it fade over time.',
        effects: [
          { type: 'reputation', amount: -3 },
        ],
        isDefault: true,
      },
    ],
  },

  {
    id: 'viral-video',
    title: 'Viral Video!',
    category: 'opportunity',
    summary: 'A customer’s video of your service goes viral online!',
    choices: [
      {
        id: 'enjoy-boost',
        label: 'Enjoy the Boost',
        description: 'Customers flood in for the next few days.',
        effects: [
          { type: 'cash', amount: 100 },
          { type: 'reputation', amount: 1 },
        ],
        isDefault: true,
      },
    ], // single choice, pure positive
  },
];
