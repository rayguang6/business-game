'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAllIndustries, Industry } from '@/lib/features/industries';
import { useGameStore } from '@/lib/store/gameStore';
import SelectIndustry from '@/app/components/screens/SelectIndustry';
import { useAudio } from '@/hooks/useAudio';
import { fetchIndustriesFromSupabase } from '@/lib/data/industryRepository';

export default function SelectIndustryPage() {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);
  const [industries, setIndustries] = useState<Industry[]>(getAllIndustries());

  // Play selection music (different from welcome and game pages)
  useAudio('selection', true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const remote = await fetchIndustriesFromSupabase();
      if (isMounted && remote && remote.length > 0) {
        setIndustries(remote);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleIndustrySelect = (industry: Industry) => {
    setSelectedIndustry(industry);
    router.push(`/game/${industry.id}`);
  };

  return (
    <SelectIndustry 
      industries={industries}
      onIndustrySelect={handleIndustrySelect}
    />
  );
}
