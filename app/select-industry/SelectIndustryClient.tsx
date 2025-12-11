'use client';

import { useRouter } from 'next/navigation';
import { Industry } from '@/lib/features/industries';
import { useGameStore } from '@/lib/store/gameStore';
import SelectIndustry from '@/app/components/screens/SelectIndustry';
import { useAudio } from '@/hooks/useAudio';

interface SelectIndustryClientProps {
  industries: Industry[];
}

export default function SelectIndustryClient({ industries }: SelectIndustryClientProps) {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);

  // Play selection music (different from welcome and game pages)
  useAudio('selection', true);

  const handleIndustrySelect = (industry: Industry) => {
    // Navigate to industry page (with username input) instead of directly to game
    router.push(`/industry/${industry.id}`);
  };

  return (
    <SelectIndustry 
      industries={industries}
      onIndustrySelect={handleIndustrySelect}
    />
  );
}


















