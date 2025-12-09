import { supabaseServer } from '@/lib/server/supabaseServer';
import { IndustryId } from '@/lib/game/types';

export interface LeaderboardEntry {
  id: string;
  industryId: string;
  username: string;
  cash: number;
  leveragedTimeCapacity: number | null; // The maximum leveraged time they had (efficiency metric)
  gameOverReason: 'victory' | 'cash' | 'time' | null;
  currentMonth: number | null;
  createdAt: Date;
}

interface LeaderboardRow {
  id: string;
  industry_id: string;
  username: string;
  cash: number;
  leveraged_time: number | null;
  game_over_reason: string | null;
  current_month: number | null;
  created_at: string;
}

export type LeaderboardMetric = 'cash' | 'leveragedTime';

export async function saveLeaderboardEntry(
  industryId: IndustryId,
  username: string,
  cash: number,
  leveragedTimeCapacity: number | null, // Use capacity instead of current time
  gameOverReason: 'victory' | 'cash' | 'time' | null,
  currentMonth: number | null,
): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  if (!username || username.trim() === '') {
    return { success: false, message: 'Username is required.' };
  }

  const payload = {
    industry_id: industryId,
    username: username.trim(),
    cash,
    leveraged_time: leveragedTimeCapacity, // Store capacity in the leveraged_time column
    game_over_reason: gameOverReason,
    current_month: currentMonth,
  };

  const { error } = await supabaseServer
    .from('leaderboard_entries')
    .insert(payload);

  if (error) {
    console.error(`[Leaderboard] Failed to save entry for industry "${industryId}":`, error);
    return { success: false, message: `Failed to save leaderboard entry: ${error.message}` };
  }

  return { success: true };
}

export async function fetchLeaderboardForIndustry(
  industryId: IndustryId,
  metric: LeaderboardMetric = 'cash',
  limit: number = 100,
  offset: number = 0,
): Promise<LeaderboardEntry[] | null> {
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch leaderboard.');
    return null;
  }

  let query = supabaseServer
    .from('leaderboard_entries')
    .select('id, industry_id, username, cash, leveraged_time, game_over_reason, current_month, created_at')
    .eq('industry_id', industryId);

  // Sort by the specified metric
  if (metric === 'cash') {
    query = query.order('cash', { ascending: false });
  } else if (metric === 'leveragedTime') {
    // For leveraged time capacity, we want the highest capacity first (biggest business)
    // Filter out null values first, then sort descending
    query = query.not('leveraged_time', 'is', null).order('leveraged_time', { ascending: false });
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error(`[Leaderboard] Failed to fetch leaderboard for industry "${industryId}":`, error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(mapRowToEntry);
}

function mapRowToEntry(row: LeaderboardRow): LeaderboardEntry {
  // Safely parse the date, fallback to current date if invalid
  let createdAt: Date;
  try {
    createdAt = row.created_at ? new Date(row.created_at) : new Date();
    // Check if the date is valid
    if (isNaN(createdAt.getTime())) {
      createdAt = new Date();
    }
  } catch (error) {
    console.warn(`[Leaderboard] Invalid date format for entry ${row.id}:`, row.created_at);
    createdAt = new Date();
  }

  return {
    id: row.id,
    industryId: row.industry_id,
    username: row.username,
    cash: Number(row.cash),
    leveragedTimeCapacity: row.leveraged_time ? Number(row.leveraged_time) : null,
    gameOverReason: (row.game_over_reason as 'victory' | 'cash' | 'time') || null,
    currentMonth: row.current_month,
    createdAt,
  };
}