import { useEffect, useRef } from 'react';
import { useGameStore } from '../lib/store/gameStore';
import {
  DEFAULT_INDUSTRY_ID,
  getEventsForIndustry,
  getRoundDurationSecondsForIndustry,
  getEventTriggerSecondsForIndustry,
} from '../lib/game/config';
import { IndustryId } from '../lib/game/types';
import { checkRequirements } from '../lib/game/requirementChecker';
import { getEventsFromStore } from '@/lib/store/configStore';

export const useRandomEventTrigger = () => {
  const gameTime = useGameStore((state) => state.gameTime);
  const currentEvent = useGameStore((state) => state.currentEvent);
  const setCurrentEvent = useGameStore((state) => state.setCurrentEvent);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const currentMonth = useGameStore((state) => state.currentMonth);
  const store = useGameStore();
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

    // Debug: Log event trigger state on first run or when industry changes
    if (
      triggerStateRef.current.month !== currentMonth ||
      triggerStateRef.current.key !== triggerKey
    ) {
      const eventsFromStore = getEventsFromStore(industryId);
      const allEvents = eventsFromStore.length > 0 ? eventsFromStore : getEventsForIndustry(industryId);

      triggerStateRef.current = {
        month: currentMonth,
        triggered: new Set<number>(),
        key: triggerKey,
      };
    }

    if (triggerPoints.length === 0) {
      // Debug: Log when no trigger points are configured (only once per month)
      if (triggerStateRef.current.month === currentMonth && triggerStateRef.current.triggered.size === 0) {
        console.warn(`[Event Trigger] ⚠️ No trigger points configured for industry "${industryId}". Events will not trigger. Check Global Config > Event Trigger Seconds.`);
        triggerStateRef.current.triggered.add(-1); // Mark as logged
      }
      return;
    }

    const timeIntoRound = Math.floor(gameTime % roundDuration);

    for (const trigger of triggerPoints) {
      if (timeIntoRound >= trigger && !triggerStateRef.current.triggered.has(trigger)) {
        triggerStateRef.current.triggered.add(trigger);
        const eventsFromStore = getEventsFromStore(industryId);
        const allEvents =
          eventsFromStore.length > 0 ? eventsFromStore : getEventsForIndustry(industryId);

        // Debug: Log event loading
        if (allEvents.length === 0) {
          console.warn(`[Event Trigger] No events found for industry "${industryId}" at trigger point ${trigger}s.`);
        }

        // Filter events based on their requirements
        const eligibleEvents = allEvents.filter(event => {
          const meetsRequirements = event.requirements ? checkRequirements(event.requirements, store) : true;
          return meetsRequirements;
        });

        if (eligibleEvents.length === 0) {
          console.warn(`[Event Trigger] No eligible events for industry "${industryId}" at trigger point ${trigger}s. Total events: ${allEvents.length}, Eligible: 0`);
        } else {
          const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
          setCurrentEvent(eligibleEvents[randomIndex]);
        }
        break;
      }
    }
  }, [gameTime, currentEvent, selectedIndustry, setCurrentEvent, currentMonth, store]);
};
