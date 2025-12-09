import { loadIndustries } from '@/lib/server/loadGameData';
import LeaderboardClient from './LeaderboardClient';

// Force dynamic rendering to ensure fresh data from database
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const industriesData = await loadIndustries();

  if (!industriesData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">Failed to Load Industries</p>
        <p className="text-base max-w-md text-blue-100">
          We couldn&apos;t load industries from the database. Please verify your Supabase setup.
        </p>
      </div>
    );
  }

  const filteredIndustries = industriesData.filter((industry) => industry.isAvailable ?? true);

  if (filteredIndustries.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">No Industries Available</p>
        <p className="text-base max-w-md text-blue-100">
          No industries are currently available. Please add industry entries in the admin panel.
        </p>
      </div>
    );
  }

  return <LeaderboardClient industries={filteredIndustries} />;
}
