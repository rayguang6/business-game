'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cacheIndustries, getCachedIndustries, Industry } from '@/lib/features/industries';
import { useGameStore } from '@/lib/store/gameStore';
import SelectIndustry from '@/app/components/screens/SelectIndustry';
import { useAudio } from '@/hooks/useAudio';
import { fetchIndustriesFromSupabase } from '@/lib/data/industryRepository';

export default function SelectIndustryPage() {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);
  const [industries, setIndustries] = useState<Industry[]>(
    getCachedIndustries().filter((industry) => industry.isAvailable ?? true),
  );
  const [isLoading, setIsLoading] = useState(industries.length === 0);
  const [loadError, setLoadError] = useState(false);

  // Play selection music (different from welcome and game pages)
  useAudio('selection', true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadError(false);
      setIsLoading(true);
      const remote = await fetchIndustriesFromSupabase();
      if (!isMounted) {
        return;
      }

      if (remote) {
        const filtered = remote.filter((industry) => industry.isAvailable ?? true);
        cacheIndustries(filtered);
        setIndustries(filtered);
        setLoadError(filtered.length === 0);
      } else {
        cacheIndustries([]);
        setIndustries([]);
        setLoadError(true);
      }
      setIsLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleIndustrySelect = (industry: Industry) => {
    setSelectedIndustry(industry);
    router.push(`/game/${industry.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 to-blue-700 text-white text-lg font-semibold">
        Loading industries...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">No industries available</p>
        <p className="text-base max-w-md text-blue-100">
          We couldn&apos;t load industries from the database. Please verify your Supabase setup or add industry entries.
        </p>
      </div>
    );
  }

  return (
    <SelectIndustry 
      industries={industries}
      onIndustrySelect={handleIndustrySelect}
    />
  );
}
