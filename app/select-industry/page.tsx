'use client';

import { useRouter } from 'next/navigation';
import { getAllIndustries } from '@/lib/game/industry/registry';
import { useGameStore } from '@/lib/store/gameStore';
import SelectIndustry from '@/app/components/screens/SelectIndustry';

export default function SelectIndustryPage() {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);
  const industries = getAllIndustries();

  const handleIndustrySelect = (industry: any) => {
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
