import { redirect } from 'next/navigation';
import { loadIndustries } from '@/lib/server/loadGameData';
import { fetchLeaderboardForIndustry, LeaderboardMetric } from '@/lib/data/leaderboardRepository';
import LeaderboardClient from './LeaderboardClient';
import type { IndustryId } from '@/lib/game/types';

// Leaderboard configuration
const LEADERBOARD_MAX_ENTRIES = 2000; // Fetch up to 2000 entries at once
const LEADERBOARD_DISPLAY_PAGE_SIZE = 100; // Show 100 entries per page on client

// Force dynamic rendering to ensure fresh leaderboard data
export const dynamic = 'force-dynamic';

interface LeaderboardPageProps {
  params: Promise<{ industry: string }>;
  searchParams: Promise<{ metric?: string }>;
}

export default async function LeaderboardPage({ params, searchParams }: LeaderboardPageProps) {
  const { industry: industryId } = await params;
  const { metric } = await searchParams;

  // Validate metric parameter
  const validMetric = (metric === 'cash' || metric === 'leveragedTime') ? metric : 'cash';
  const leaderboardMetric = validMetric as LeaderboardMetric;

  const [industries, cashLeaderboard, leveragedTimeLeaderboard] = await Promise.all([
    loadIndustries(),
    fetchLeaderboardForIndustry(industryId as IndustryId, 'cash', LEADERBOARD_MAX_ENTRIES, 0), // Load all entries
    fetchLeaderboardForIndustry(industryId as IndustryId, 'leveragedTime', LEADERBOARD_MAX_ENTRIES, 0), // Load all entries
  ]);

  if (!industries) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">Failed to Load Industries</p>
        <p className="text-base max-w-md text-blue-100">
          We couldn&apos;t load industries from the database. Please verify your Supabase setup.
        </p>
      </div>
    );
  }

  const industry = industries.find((i) => i.id === industryId);

  if (!industry) {
    redirect('/select-industry');
  }

  return (
    <LeaderboardClient
      industry={industry}
      cashLeaderboard={cashLeaderboard || []}
      leveragedTimeLeaderboard={leveragedTimeLeaderboard || []}
      currentMetric={leaderboardMetric}
    />
  );
}