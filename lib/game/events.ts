import { GameEvent } from "../types/gameEvents";

export const sampleEvents: GameEvent[] = [
  {
    id: 'influencer-shoutout',
    title: 'Influencer Shoutout',
    category: 'opportunity',
    summary: 'A local influencer wants to feature your business.',
    narrative:
      'A micro-influencer with a loyal local following stopped by and loved the vibe. They offer to post about you tonight if you cover a VIP experience for their crew.',
    choices: [
      {
        id: 'host',
        label: 'Host VIP Night',
        description: 'Cover the costs and ride the hype wave.',
        effects: [
          { type: 'oneTimeCost', amount: 300, label: 'Influencer VIP Night', category: 'event' },
          { type: 'reputation', amount: 6 },
        ],
      },
      {
        id: 'pass',
        label: 'Pass on Offer',
        description: 'Play it safe and keep the week predictable.',
        effects: [],
        isDefault: true,
      },
    ],
  },
  {
    id: 'equipment-malfunction',
    title: 'Equipment Malfunction',
    category: 'risk',
    summary: 'One of your critical machines is starting to fail.',
    narrative:
      'A warning light is flashing on your most-used equipment. You can keep using it for now, but the technician warns it could fail mid-week without attention.',
    choices: [
      {
        id: 'repair',
        label: 'Schedule Repair',
        description: 'Pay for maintenance now and keep customers happy.',
        effects: [
          { type: 'oneTimeCost', amount: 500, label: 'Emergency Equipment Repair', category: 'repair' },
          { type: 'reputation', amount: 2 },
        ],
      },
      {
        id: 'run-it',
        label: 'Risk It',
        description: 'Hope for the best and save cash this week.',
        effects: [
          { type: 'cash', amount: -200, label: 'Lost productivity' },
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
    summary: 'A health inspector shows up unannounced.',
    narrative:
      'The health inspector is here! You can either try to bribe them to overlook minor issues or deal with potential fines.',
    choices: [
      {
        id: 'bribe',
        label: 'Bribe Inspector',
        description: 'A small payment to make problems disappear.',
        effects: [
          { type: 'cash', amount: -200, label: 'Bribe' },
          { type: 'reputation', amount: -1 },
        ],
      },
      {
        id: 'comply',
        label: 'Comply Fully',
        description: 'Face the fines, but maintain integrity.',
        effects: [
          { type: 'cash', amount: -500, label: 'Inspection Fine' },
          { type: 'reputation', amount: 3 },
        ],
        isDefault: true,
      },
    ],
  },
  {
    id: 'local-festival',
    title: 'Local Festival',
    category: 'opportunity',
    summary: 'A large local festival is happening nearby.',
    narrative:
      'A huge local festival is setting up just a few blocks away. This is a chance for massive foot traffic, but you will need to invest to handle the rush.',
    choices: [
      {
        id: 'staff-up',
        label: 'Hire Temporary Staff',
        description: 'Increase capacity to handle the surge in customers.',
        effects: [
          { type: 'oneTimeCost', amount: 400, label: 'Temporary Staff' },
          { type: 'cash', amount: 1000, label: 'Festival Revenue' },
          { type: 'reputation', amount: 5 },
        ],
      },
      {
        id: 'normal-operations',
        label: 'Normal Operations',
        description: 'Avoid the extra cost, but miss out on potential gains.',
        effects: [],
        isDefault: true,
      },
    ],
  },
];
