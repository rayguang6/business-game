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

  // Cache for event sequencing data
  const [sequencingConfig, setSequencingConfig] = useState<{
    selectionMode: 'random' | 'sequence';
    eventSequence: string[] | null;
  }>({
    selectionMode: 'random',
    eventSequence: null,
  });

  // Load event sequencing config when industry changes
  useEffect(() => {
    const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

    const loadSequencingConfig = async () => {
      try {
        const { fetchIndustrySimulationConfig } = await import('@/lib/data/industrySimulationConfigRepository');
        const config = await fetchIndustrySimulationConfig(industryId);

        const newConfig = {
          selectionMode: config?.eventSelectionMode ?? 'random',
          eventSequence: config?.eventSequence ?? null,
        };

        console.log(`[Event Sequence] 📋 Loaded config for industry "${industryId}":`, {
          mode: newConfig.selectionMode,
          eventSequence: newConfig.eventSequence,
          sequenceLength: newConfig.eventSequence?.length ?? 0,
        });

        setSequencingConfig(newConfig);
      } catch (error) {
        console.error('Failed to load event sequencing config:', error);
        setSequencingConfig({
          selectionMode: 'random',
          eventSequence: null,
        });
      }
    };

    loadSequencingConfig();
  }, [selectedIndustry]);

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
          const { selectionMode, eventSequence } = sequencingConfig;

          // Log the mode and event list
          console.log(`[Event Sequence] 🎲 Selection Mode: "${selectionMode}"`);
          const currentSeqIndex = store.eventSequenceIndex;
          const currentSeqPosition = currentSeqIndex % (eventSequence?.length || 1);
          console.log(`[Event Sequence] 📝 Sequence Counter: ${currentSeqIndex} (position in sequence: ${currentSeqPosition})`);
          
          if (selectionMode === 'sequence' && eventSequence && eventSequence.length > 0) {
            console.log(`[Event Sequence] 📋 Event Sequence List:`, eventSequence.map((id, idx) => `${idx}: ${id}`));
            console.log(`[Event Sequence] 📋 All Events:`, allEvents.map(e => ({ id: e.id, title: e.title })));
            console.log(`[Event Sequence] 📋 Eligible Events:`, eligibleEvents.map(e => ({ id: e.id, title: e.title })));
            
            // Sequential selection - try to find the next eligible event in sequence
            let selectedEvent = null;
            let foundIndex = -1;
            const startIndex = store.eventSequenceIndex % eventSequence.length;
            
            // Try to find an eligible event starting from the current sequence index
            for (let i = 0; i < eventSequence.length; i++) {
              const checkIndex = (startIndex + i) % eventSequence.length;
              const targetEventId = eventSequence[checkIndex];
              
              console.log(`[Event Sequence] 🔍 Checking sequence[${checkIndex}]: "${targetEventId}"`);
              
              // Check if event exists in all events
              const eventExists = allEvents.some(e => e.id === targetEventId);
              if (!eventExists) {
                console.warn(`[Event Sequence] ⚠️ Event "${targetEventId}" does not exist in events list`);
                continue;
              }
              
              // Check if event is eligible
              const eligibleEvent = eligibleEvents.find(event => event.id === targetEventId);
              if (eligibleEvent) {
                selectedEvent = eligibleEvent;
                foundIndex = checkIndex;
                console.log(`[Event Sequence] ✅ Found eligible event at sequence[${checkIndex}]: "${targetEventId}"`);
                break;
              } else {
                // Check why it's not eligible
                const eventInAll = allEvents.find(e => e.id === targetEventId);
                if (eventInAll) {
                  console.warn(`[Event Sequence] ⚠️ Event "${targetEventId}" exists but doesn't meet requirements`);
                  if (eventInAll.requirements) {
                    console.log(`[Event Sequence] 📋 Requirements for "${targetEventId}":`, eventInAll.requirements);
                  }
                }
              }
            }

            if (selectedEvent) {
              console.log(`[Event Sequence] ✅ Selected Event: "${selectedEvent.title}" (${selectedEvent.id}) from sequence[${foundIndex}]`);
              
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
              
              console.log(`[Event Sequence] 📍 Advancing sequence: ${currentSequenceIndex} → ${nextIndex} (advance by ${advanceBy})`);
              
              // Advance the sequence
              for (let i = 0; i < advanceBy; i++) {
                store.advanceEventSequence();
              }
              
              setCurrentEvent(selectedEvent);
            } else {
              console.warn(`[Event Sequence] ⚠️ No eligible events found in sequence, falling back to random`);
              console.log(`[Event Sequence] 📋 Available eligible events:`, eligibleEvents.map(e => ({ id: e.id, title: e.title })));
              // Advance sequence by 1 so we don't get stuck on the same ineligible event
              store.advanceEventSequence();
              const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
              const randomEvent = eligibleEvents[randomIndex];
              console.log(`[Event Sequence] 🎲 Randomly selected: "${randomEvent.title}" (${randomEvent.id})`);
              setCurrentEvent(randomEvent);
            }
          } else {
            console.log(`[Event Sequence] 🎲 Random Mode - Eligible Events:`, eligibleEvents.map(e => ({ id: e.id, title: e.title })));
            const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
            const randomEvent = eligibleEvents[randomIndex];
            console.log(`[Event Sequence] 🎲 Randomly selected: "${randomEvent.title}" (${randomEvent.id})`);
            setCurrentEvent(randomEvent);
          }
        }
        break;
      }
    }
  }, [gameTime, currentEvent, selectedIndustry, setCurrentEvent, currentMonth, store]);
};
