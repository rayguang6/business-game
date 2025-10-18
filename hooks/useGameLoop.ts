import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID, getTickIntervalMsForIndustry } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';

export const useGameLoop = () => {
  const isGameStarted = useGameStore((state) => state.isGameStarted);
  const tickGame = useGameStore((state) => state.tickGame);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const tickInterval = getTickIntervalMsForIndustry(industryId);

  useEffect(() => {
    if (!isGameStarted) {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }

    // Run loop every tick interval (100ms)
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(() => {
      tickGame(); // tick-based system 
    }, tickInterval);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [isGameStarted, tickGame, tickInterval]);
};
