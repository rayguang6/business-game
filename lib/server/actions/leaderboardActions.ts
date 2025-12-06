'use server';

import { supabaseServer } from '@/lib/server/supabaseServer';
import type { IndustryId } from '@/lib/game/types';
import type { Metrics } from '@/lib/store/types';

export interface GameMetricsPayload {
  username: string;
  industryId: IndustryId;
  metrics: Metrics;
  currentMonth: number;
  gameTime: number;
  gameOverReason: 'cash' | 'time' | 'victory' | null;
  finalCash: number;
  finalExp: number;
  finalFreedomScore: number;
  totalRevenue: number;
  totalExpenses: number;
  customersServed: number;
  customersLeftImpatient: number;
  customersServiceFailed: number;
}

/**
 * Save game metrics to the leaderboard table.
 * This is called when a game ends (win or lose).
 */
export async function saveGameMetrics(payload: GameMetricsPayload): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  try {
    const { error } = await supabaseServer
      .from('game_sessions')
      .insert({
        username: payload.username,
        industry_id: payload.industryId,
        current_month: payload.currentMonth,
        game_time: payload.gameTime,
        game_over_reason: payload.gameOverReason,
        final_cash: payload.finalCash,
        final_exp: payload.finalExp,
        final_freedom_score: payload.finalFreedomScore,
        total_revenue: payload.totalRevenue,
        total_expenses: payload.totalExpenses,
        customers_served: payload.customersServed,
        customers_left_impatient: payload.customersLeftImpatient,
        customers_service_failed: payload.customersServiceFailed,
        metrics: payload.metrics,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to save game metrics:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving game metrics:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}



