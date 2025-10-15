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

    //TODO: change the value, and also extract to config
    if (timeSinceLastCheck >= 15 && currentEvent === null) { // Changed from 10 to 15 seconds
      lastCheckTimeRef.current = gameTime;

      //TODO: change the value, and also extract to config
      if (Math.random() < 0.99) { // 99% chance
        const events = sampleEvents; // Get Events from Industry
        if (events.length > 0) {
          const randomIndex = Math.floor(Math.random() * events.length);
          setCurrentEvent(events[randomIndex]);
        }
      }
    }
  }, [gameTime, currentEvent, setCurrentEvent]);
};
