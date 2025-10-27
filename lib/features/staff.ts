import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';

export interface Staff {
  id: string;
  name: string;
  salary: number;
  increaseServiceSpeed: number; // Percentage: 10 = 10% speed boost (1.1x faster service)
  increaseHappyCustomerProbability: number; // Percentage points: 4 = +4% to happy chance
  emoji: string; // To represent the staff member
  rank: 'blue' | 'purple' | 'orange' | 'red';
  role: string;
  level: number;
  hireCost: number; // Cost to hire this staff member
}

export interface StaffApplicant extends Staff {
  isHired: boolean;
}

export const STAFF_NAMES = [
  'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Charlotte', 'Elijah', 'Amelia',
  'James', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Lucas', 'Mia',
  'Henry', 'Evelyn', 'Theodore', 'Harper', 'Jackson', 'Camila', 'Samuel', 'Abigail',
];

export const getRankStyles = (rank: Staff['rank']) => {
  switch (rank) {
    case 'blue':
      return {
        card: 'from-blue-900 to-blue-800 border-blue-600',
        avatarBg: 'bg-blue-500',
        textColor: 'text-blue-200',
      };
    case 'purple':
      return {
        card: 'from-purple-900 to-purple-800 border-purple-600',
        avatarBg: 'bg-purple-500',
        textColor: 'text-purple-200',
      };
    case 'orange':
      return {
        card: 'from-orange-700 to-orange-600 border-orange-500',
        avatarBg: 'bg-orange-500',
        textColor: 'text-orange-200',
      };
    case 'red':
      return {
        card: 'from-red-900 to-red-800 border-red-600',
        avatarBg: 'bg-red-500',
        textColor: 'text-red-200',
      };
    default:
      return {
        card: 'from-gray-700 to-gray-600 border-gray-500',
        avatarBg: 'bg-gray-500',
        textColor: 'text-gray-200',
      };
  }
};

export const getRandomEmoji = (rank: Staff['rank']): string => {
  const emojis: Record<Staff['rank'], string[]> = {
    blue: ['👩‍⚕️', '👨‍🔬', '👩‍🔧', '👨‍💻'],
    purple: ['👩‍🎓', '👨‍💼', '👩‍🏫', '👨‍⚖️'],
    orange: ['👩‍🚀', '👨‍🎤', '👩‍🎨', '👨‍✈️'],
    red: ['🧙‍♀️', '🧝‍♂️', '👸', '🤴'],
  };
  const availableEmojis = emojis[rank] || emojis.blue;
  return availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
};

export const generateRandomStaff = (id: string): Staff => {
  // Determine initial rank based on a more generous random roll
  let rank: Staff['rank'];
  const initialRoll = Math.random();
  if (initialRoll < 0.05) {
    rank = 'red'; // 5% chance for Red
  } else if (initialRoll < 0.20) {
    rank = 'orange'; // 15% chance for Orange (20% total for Orange or better)
  } else if (initialRoll < 0.45) {
    rank = 'purple'; // 25% chance for Purple (45% total for Purple or better)
  } else {
    rank = 'blue'; // 55% chance for Blue
  }

  const getStatMultiplier = (currentRank: Staff['rank']) => {
    switch (currentRank) {
      case 'blue': return 1.0;
      case 'purple': return 1.2;
      case 'orange': return 1.5;
      case 'red': return 2.0;
      default: return 1.0;
    }
  };
  const multiplier = getStatMultiplier(rank);

  const salary = Math.round((500 * multiplier + Math.random() * 200) / 100) * 100;
  // Speed boost as percentage: 5-10% for blue, scales with rank
  const increaseServiceSpeed = Math.round(5 * multiplier + Math.random() * 5);
  // Happy probability as percentage points: 1-5% for blue, scales with rank
  const increaseHappyCustomerProbability = Math.round(1 * multiplier + Math.random() * 4);
  const level = Math.floor(Math.random() * 5 * multiplier) + 1; // Level 1-5 for blue, higher for others
  const hireCost = Math.round((salary * 2 + level * 50) / 100) * 100; // Example cost calculation

  const roles = ['Assistant', 'Specialist', 'Technician', 'Engineer', 'Manager', 'Consultant'];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const randomName = STAFF_NAMES[Math.floor(Math.random() * STAFF_NAMES.length)];

  return {
    id,
    name: randomName,
    salary,
    increaseServiceSpeed,
    increaseHappyCustomerProbability,
    emoji: getRandomEmoji(rank),
    rank,
    role,
    level,
    hireCost,
  };
};

/**
 * Add a staff member's effects to the effect manager
 * This should be called when a staff member is hired
 */
export function addStaffEffects(staff: Staff): void {
  // Service speed boost (stored as percentage)
  // e.g., 10 = +10% speed boost, which means duration ÷ 1.10
  if (staff.increaseServiceSpeed > 0) {
    effectManager.add({
      id: `staff_${staff.id}_speed`,
      source: {
        category: 'staff',
        id: staff.id,
        name: staff.name,
      },
      metric: GameMetric.ServiceSpeedMultiplier,
      type: EffectType.Percent,
      value: staff.increaseServiceSpeed,
    });
  }

  // Happy customer probability boost (convert percentage points to decimal)
  // e.g., 4 = +4% = +0.04 to probability (which is 0-1 range)
  if (staff.increaseHappyCustomerProbability > 0) {
    effectManager.add({
      id: `staff_${staff.id}_happy`,
      source: {
        category: 'staff',
        id: staff.id,
        name: staff.name,
      },
      metric: GameMetric.HappyProbability,
      type: EffectType.Add,
      value: staff.increaseHappyCustomerProbability / 100, // Convert to 0-1 range
    });
  }

  // Weekly salary expense
  if (staff.salary > 0) {
    effectManager.add({
      id: `staff_${staff.id}_salary`,
      source: {
        category: 'staff',
        id: staff.id,
        name: staff.name,
      },
      metric: GameMetric.WeeklyExpenses,
      type: EffectType.Add,
      value: staff.salary,
    });
  }
}

/**
 * Remove a staff member's effects from the effect manager
 * This should be called when a staff member is fired/removed
 */
export function removeStaffEffects(staffId: string): void {
  effectManager.removeBySource('staff', staffId);
}
