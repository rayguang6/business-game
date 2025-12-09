import { redirect } from 'next/navigation';
import { loadIndustries } from '@/lib/server/loadGameData';
import { fetchLeaderboardForIndustry } from '@/lib/data/leaderboardRepository';
import LeaderboardClient from './LeaderboardClient';
import type { IndustryId } from '@/lib/game/types';

// Force dynamic rendering to ensure fresh leaderboard data
export const dynamic = 'force-dynamic';

interface LeaderboardPageProps {
  params: Promise<{ industry: string }>;
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { industry: industryId } = await params;

  const [industries, leaderboardEntries] = await Promise.all([
    loadIndustries(),
    fetchLeaderboardForIndustry(industryId as IndustryId, 100),
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
      leaderboardEntries={leaderboardEntries || []}
    />
  );
}
