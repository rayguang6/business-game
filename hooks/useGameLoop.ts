import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { TICK_INTERVAL_MS } from '@/lib/game/config';

export const useGameLoop = () => {
  const isGameStarted = useGameStore((state) => state.isGameStarted);
  const tickGame = useGameStore((state) => state.tickGame);
  const loopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isGameStarted) {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }

    // Run loop every tick interval (100ms)
    loopRef.current = setInterval(() => {
      tickGame(); // tick-based system 
    }, TICK_INTERVAL_MS);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [isGameStarted, tickGame]); // Note: isPaused is handled inside tickGame
};
