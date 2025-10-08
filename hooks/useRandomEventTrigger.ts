import { useEffect, useRef } from "react";
import { useGameStore } from "../lib/store/gameStore";
import { sampleEvents } from "../lib/game/events";

export const useRandomEventTrigger = () => {
  const gameTime = useGameStore((state) => state.gameTime);
  const currentEvent = useGameStore((state) => state.currentEvent);
  const setCurrentEvent = useGameStore((state) => state.setCurrentEvent);

  const lastCheckTimeRef = useRef(0);

  useEffect(() => {
    // Only run if game is started and no event is currently active
    if (gameTime === 0) {
      lastCheckTimeRef.current = 0; // Reset on game start/reset
      return;
    }

    const timeSinceLastCheck = gameTime - lastCheckTimeRef.current;

    if (timeSinceLastCheck >= 10 && currentEvent === null) { // Changed from 5 to 10 seconds
      lastCheckTimeRef.current = gameTime;

      if (Math.random() < 0.99) { // 99% chance
        const events = sampleEvents;
        if (events.length > 0) {
          const randomIndex = Math.floor(Math.random() * events.length);
          setCurrentEvent(events[randomIndex]);
        }
      }
    }
  }, [gameTime, currentEvent, setCurrentEvent]);
};
