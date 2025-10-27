import { useEffect, useRef } from 'react';
import { useGameStore } from '../lib/store/gameStore';
import {
  DEFAULT_INDUSTRY_ID,
  getEventsForIndustry,
  getRoundDurationSecondsForIndustry,
  getEventTriggerSecondsForIndustry,
} from '../lib/game/config';
import { IndustryId } from '../lib/game/types';

export const useRandomEventTrigger = () => {
  const gameTime = useGameStore((state) => state.gameTime);
  const currentEvent = useGameStore((state) => state.currentEvent);
  const setCurrentEvent = useGameStore((state) => state.setCurrentEvent);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const currentMonth = useGameStore((state) => state.currentMonth);
  const triggerStateRef = useRef<{ month: number; triggered: Set<number>; key: string }>({
    month: 0,
    triggered: new Set<number>(),
    key: '',
  });

  useEffect(() => {
    if (gameTime <= 0 || currentEvent) {
      return;
    }

    const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const roundDuration = getRoundDurationSecondsForIndustry(industryId);

    if (roundDuration <= 0) {
      return;
    }

    const triggerPoints = getEventTriggerSecondsForIndustry(industryId);
    const triggerKey = triggerPoints.join(',');

    if (
      triggerStateRef.current.month !== currentMonth ||
      triggerStateRef.current.key !== triggerKey
    ) {
      triggerStateRef.current = {
        month: currentMonth,
        triggered: new Set<number>(),
        key: triggerKey,
      };
    }

    if (triggerPoints.length === 0) {
      return;
    }

    const timeIntoRound = Math.floor(gameTime % roundDuration);

    for (const trigger of triggerPoints) {
      if (timeIntoRound >= trigger && !triggerStateRef.current.triggered.has(trigger)) {
        triggerStateRef.current.triggered.add(trigger);
        const events = getEventsForIndustry(industryId);
        if (events.length > 0) {
          const randomIndex = Math.floor(Math.random() * events.length);
          setCurrentEvent(events[randomIndex]);
        }
        break;
      }
    }
  }, [gameTime, currentEvent, selectedIndustry, setCurrentEvent, currentMonth]);
};
