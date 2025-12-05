import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../lib/store/gameStore';
import {
  DEFAULT_INDUSTRY_ID,
  getEventsForIndustry,
  getRoundDurationSecondsForIndustry,
  getEventTriggerSecondsForIndustry,
} from '../lib/game/config';
import { IndustryId } from '../lib/game/types';
import { checkRequirements } from '../lib/game/requirementChecker';
import { getEventsFromStore, useConfigStore } from '@/lib/store/configStore';

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

  // Get event sequencing config from config store (loaded server-side)
  const getSequencingConfig = () => {
    const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const industryConfig = useConfigStore.getState().industryConfigs[industryId];
    
    return {
      selectionMode: (industryConfig?.eventSelectionMode ?? 'random') as 'random' | 'sequence',
      eventSequence: industryConfig?.eventSequence ?? null,
    };
  };

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
      return;
    }

    const timeIntoRound = Math.floor(gameTime % roundDuration);

    for (const trigger of triggerPoints) {
      if (timeIntoRound >= trigger && !triggerStateRef.current.triggered.has(trigger)) {
        triggerStateRef.current.triggered.add(trigger);
        const eventsFromStore = getEventsFromStore(industryId);
        const allEvents =
          eventsFromStore.length > 0 ? eventsFromStore : getEventsForIndustry(industryId);

        // No events found - continue silently

        // Filter events based on their requirements
        const eligibleEvents = allEvents.filter(event => {
          const meetsRequirements = event.requirements ? checkRequirements(event.requirements, store) : true;
          return meetsRequirements;
        });

        if (eligibleEvents.length === 0) {
          // No eligible events - continue silently
        } else {
          const { selectionMode, eventSequence } = getSequencingConfig();

          if (selectionMode === 'sequence' && eventSequence && eventSequence.length > 0) {
            // Sequential selection - try to find the next eligible event in sequence
            let selectedEvent = null;
            let foundIndex = -1;
            const startIndex = store.eventSequenceIndex % eventSequence.length;

            // Try to find an eligible event starting from the current sequence index
            for (let i = 0; i < eventSequence.length; i++) {
              const checkIndex = (startIndex + i) % eventSequence.length;
              const targetEventId = eventSequence[checkIndex];

              // Check if event exists in all events
              const eventExists = allEvents.some(e => e.id === targetEventId);
              if (!eventExists) {
                continue;
              }

              // Check if event is eligible
              const eligibleEvent = eligibleEvents.find(event => event.id === targetEventId);
              if (eligibleEvent) {
                selectedEvent = eligibleEvent;
                foundIndex = checkIndex;
                break;
              }
            }

            if (selectedEvent) {
              // Advance sequence to the position AFTER the found event
              // This ensures we don't repeat the same event and continue in order
              const currentSequenceIndex = store.eventSequenceIndex % eventSequence.length;
              const nextIndex = (foundIndex + 1) % eventSequence.length;

              // Calculate how many steps to advance
              let advanceBy = 0;
              if (foundIndex >= currentSequenceIndex) {
                // Found event is ahead or at current position
                advanceBy = (foundIndex - currentSequenceIndex) + 1;
              } else {
                // Found event wrapped around (we're past it in the sequence)
                advanceBy = (eventSequence.length - currentSequenceIndex) + foundIndex + 1;
              }

              // Advance the sequence
              for (let i = 0; i < advanceBy; i++) {
                store.advanceEventSequence();
              }

              setCurrentEvent(selectedEvent);
            } else {
              // Advance sequence by 1 so we don't get stuck on the same ineligible event
              store.advanceEventSequence();
              const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
              const randomEvent = eligibleEvents[randomIndex];
              setCurrentEvent(randomEvent);
            }
          } else {
            const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
            const randomEvent = eligibleEvents[randomIndex];
            setCurrentEvent(randomEvent);
          }
        }
        break;
      }
    }
  }, [gameTime, currentEvent, selectedIndustry, setCurrentEvent, currentMonth, store]);
};
