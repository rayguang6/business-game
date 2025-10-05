'use client';

import { useRouter } from 'next/navigation';
import { getAllIndustries } from '@/lib/features/industries';
import { useGameStore } from '@/lib/store/gameStore';
import SelectIndustry from '@/app/components/screens/SelectIndustry';
import { Industry } from '@/lib/features/industries';
import { useAudio } from '@/hooks/useAudio';

export default function SelectIndustryPage() {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);
  const industries = getAllIndustries();
  
  // Play selection music (different from welcome and game pages)
  useAudio('selection', true);

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
