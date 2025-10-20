import { UpgradeEffect, UpgradeEffectType, UpgradeMetric } from '@/lib/game/config';
import { EffectBundle } from '@/lib/game/effects';

export interface Staff {
  id: string;
  name: string;
  salary: number;
  increaseServiceSpeed: number; // e.g., 0.1 for 10% increase
  increaseHappyCustomerProbability: number; // e.g., 0.05 for 5% increase
  emoji: string; // To represent the staff member
  rank: 'blue' | 'purple' | 'orange' | 'red';
  role: string;
  level: number;
  hireCost: number; // Cost to hire this staff member
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
  const increaseServiceSpeed = parseFloat((0.05 * multiplier + Math.random() * 0.05).toFixed(2));
  const increaseHappyCustomerProbability = parseFloat((0.03 * multiplier + Math.random() * 0.03).toFixed(2));
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

export function buildStaffEffectBundle(staffMembers: Staff[]): EffectBundle | null {
  if (!staffMembers || staffMembers.length === 0) {
    return null;
  }

  const totalServiceSpeedPercent = staffMembers.reduce(
    (sum, staff) => sum + (staff.increaseServiceSpeed ?? 0),
    0,
  );
  const totalReputationPercent = staffMembers.reduce(
    (sum, staff) => sum + (staff.increaseHappyCustomerProbability ?? 0),
    0,
  );
  const totalSalary = staffMembers.reduce((sum, staff) => sum + (staff.salary ?? 0), 0);

  const effects: UpgradeEffect[] = [];

  if (totalServiceSpeedPercent !== 0) {
    effects.push({
      metric: UpgradeMetric.ServiceSpeedMultiplier,
      type: UpgradeEffectType.Percent,
      value: -totalServiceSpeedPercent,
      source: `Staff service boost (-${(totalServiceSpeedPercent * 100).toFixed(0)}%)`,
    });
  }

  if (totalReputationPercent !== 0) {
    effects.push({
      metric: UpgradeMetric.ReputationMultiplier,
      type: UpgradeEffectType.Percent,
      value: totalReputationPercent,
      source: `Staff reputation boost (+${(totalReputationPercent * 100).toFixed(0)}%)`,
    });
  }

  if (totalSalary > 0) {
    effects.push({
      metric: UpgradeMetric.WeeklyExpenses,
      type: UpgradeEffectType.Add,
      value: totalSalary,
      source: 'Staff salaries',
    });
  }

  if (effects.length === 0) {
    return null;
  }

  return { id: 'staff', effects };
}
