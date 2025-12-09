import { NextRequest, NextResponse } from 'next/server';
import { fetchLeaderboardForIndustry, LeaderboardMetric } from '@/lib/data/leaderboardRepository';
import { IndustryId } from '@/lib/game/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ industry: string; metric: string }> }
) {
  try {
    const { industry: industryId, metric } = await params;
    const { searchParams } = new URL(request.url);
    // Leaderboard configuration - fetch all entries at once
    const LEADERBOARD_MAX_ENTRIES = 30;

    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || LEADERBOARD_MAX_ENTRIES.toString());

    // Validate parameters
    if (!industryId || !metric) {
      return NextResponse.json({ error: 'Missing industry or metric parameter' }, { status: 400 });
    }

    if (metric !== 'cash' && metric !== 'leveragedTime') {
      return NextResponse.json({ error: 'Invalid metric parameter' }, { status: 400 });
    }

    if (offset < 0 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid offset or limit parameter' }, { status: 400 });
    }

    const entries = await fetchLeaderboardForIndustry(
      industryId as IndustryId,
      metric as LeaderboardMetric,
      limit,
      offset
    );

    if (!entries) {
      return NextResponse.json({ error: 'Failed to fetch leaderboard entries' }, { status: 500 });
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}