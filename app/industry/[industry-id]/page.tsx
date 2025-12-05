import { redirect } from 'next/navigation';
import { loadIndustries } from '@/lib/server/loadGameData';
import IndustryClient from './IndustryClient';
import GameButton from '@/app/components/ui/GameButton';

interface IndustryPageProps {
  params: Promise<{ 'industry-id': string }>;
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { 'industry-id': industryId } = await params;
  
  const industries = await loadIndustries();
  
  if (!industries) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">Failed to Load Industries</p>
        <p className="text-base max-w-md text-blue-100">
          We couldn&apos;t load industries from the database. Please verify your Supabase setup.
        </p>
        <GameButton color="blue" href="/select-industry">
          Back to Industries
        </GameButton>
      </div>
    );
  }
  
  const industry = industries.find((i) => i.id === industryId);
  
  if (!industry) {
    redirect('/select-industry');
  }
  
  if (!industry.isAvailable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">Industry Not Available</p>
        <p className="text-base max-w-md text-blue-100">
          This industry is not currently available.
        </p>
        <GameButton color="blue" href="/select-industry">
          Back to Industries
        </GameButton>
      </div>
    );
  }

  return <IndustryClient industry={industry} />;
}

