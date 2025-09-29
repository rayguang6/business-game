import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export const useGameLoop = () => {
  const { isGameStarted, isPaused, tickGame } = useGameStore();
  const loopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isGameStarted) {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }

    // Run loop every 100ms
    loopRef.current = setInterval(() => {
      tickGame(); // tick-based system
    }, 100);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [isGameStarted, tickGame]); // Note: isPaused is handled inside tickGame
};