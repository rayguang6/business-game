'use server';

import { saveLeaderboardEntry } from '@/lib/data/leaderboardRepository';
import { IndustryId } from '@/lib/game/types';

export async function saveGameResult(
  industryId: IndustryId,
  username: string,
  cash: number,
  leveragedTimeCapacity: number | null, // Use capacity instead of current time
  gameOverReason: 'victory' | 'cash' | 'time' | null,
  currentMonth: number | null,
): Promise<{ success: boolean; message?: string }> {
  return await saveLeaderboardEntry(
    industryId,
    username,
    cash,
    leveragedTimeCapacity,
    gameOverReason,
    currentMonth,
  );
}
