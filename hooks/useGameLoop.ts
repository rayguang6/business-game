import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { DEFAULT_INDUSTRY_ID, getTickIntervalMsForIndustry } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';

export const useGameLoop = () => {
  const isGameStarted = useGameStore((state) => state.isGameStarted);
  const tickGame = useGameStore((state) => state.tickGame);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const configStatus = useConfigStore((state) => state.configStatus);
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  useEffect(() => {
    // Don't start the loop if config is not ready
    if (configStatus !== 'ready') {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }

    // Don't start the loop if game is not started
    if (!isGameStarted) {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }

    // Get tick interval - this will throw if business stats are not loaded
    // but we've already checked configStatus === 'ready', so it should be safe
    let tickInterval: number;
    try {
      tickInterval = getTickIntervalMsForIndustry(industryId);
    } catch (error) {
      console.error('Failed to get tick interval:', error);
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
  }, [isGameStarted, tickGame, configStatus, industryId]);
};
