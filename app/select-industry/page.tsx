import { redirect } from 'next/navigation';
import { loadIndustries } from '@/lib/server/loadGameData';
import SelectIndustryClient from './SelectIndustryClient';
import { supabaseServer } from '@/lib/server/supabaseServer';

// Force dynamic rendering to ensure fresh data from database
export const dynamic = 'force-dynamic';

// Event route protection - redirects users during offline events
async function checkRouteProtection() {
  if (!supabaseServer) return;

  const { data } = await supabaseServer
    .from('route_protection')
    .select('enabled, redirect_target')
    .limit(1)
    .maybeSingle();

  if (data?.enabled && data?.redirect_target) {
    redirect(data.redirect_target);
  }
}

export default async function SelectIndustryPage() {
  // Check route protection for offline events
  await checkRouteProtection();

  const industriesData = await loadIndustries();
  
  if (!industriesData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">No industries available</p>
        <p className="text-base max-w-md text-blue-100">
          We couldn&apos;t load industries from the database. Please verify your Supabase setup or add industry entries.
        </p>
      </div>
    );
  }

  const filteredIndustries = industriesData.filter((industry) => industry.isAvailable ?? true);

  if (filteredIndustries.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">No industries available</p>
        <p className="text-base max-w-md text-blue-100">
          No industries are currently available. Please add industry entries in the admin panel.
        </p>
      </div>
    );
  }

  return <SelectIndustryClient industries={filteredIndustries} />;
}
