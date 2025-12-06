import { useState, useEffect, useCallback } from 'react';
import type { IndustryId, GridPosition, ServiceRoomConfig } from '@/lib/game/types';
import type {
  BusinessMetrics,
  BusinessStats,
} from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';
import { fetchIndustryConfig, fetchEvents, upsertIndustryConfig } from '@/lib/server/actions/adminActions';

type Operation = 'idle' | 'loading' | 'saving';

export function useIndustrySimulationConfig(industryId: IndustryId | null) {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
  
  // Map config - separate fields (no more JSON parsing!)
  const [mapWidth, setMapWidth] = useState<number | null>(null);
  const [mapHeight, setMapHeight] = useState<number | null>(null);
  const [mapWalls, setMapWalls] = useState<GridPosition[]>([]);
  
  // Layout config - separate fields (no more JSON parsing!)
  const [entryPosition, setEntryPosition] = useState<GridPosition | null>(null);
  const [waitingPositions, setWaitingPositions] = useState<GridPosition[]>([]);
  const [serviceRooms, setServiceRooms] = useState<ServiceRoomConfig[]>([]);
  const [staffPositions, setStaffPositions] = useState<GridPosition[]>([]);
  const [mainCharacterPosition, setMainCharacterPosition] = useState<GridPosition | null>(null);
  const [mainCharacterSpriteImage, setMainCharacterSpriteImage] = useState<string>('');
  
  const [capacityImage, setCapacityImage] = useState<string>('');
  const [winCondition, setWinCondition] = useState<WinCondition | null>(null);
  const [loseCondition, setLoseCondition] = useState<LoseCondition | null>(null);
  const [leadDialogues, setLeadDialogues] = useState<string[] | null>(null);

  // Event sequencing
  const [eventSelectionMode, setEventSelectionMode] = useState<'random' | 'sequence'>('random');
  const [eventSequence, setEventSequence] = useState<string[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);

  // customerImages and staffNamePool removed - they're global only

  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!industryId) {
      setBusinessMetrics(null);
      setBusinessStats(null);
      setMapWidth(null);
      setMapHeight(null);
      setMapWalls([]);
      setEntryPosition(null);
      setWaitingPositions([]);
      setServiceRooms([]);
      setStaffPositions([]);
      setMainCharacterPosition(null);
      setMainCharacterSpriteImage('');
      setCapacityImage('');
      setWinCondition(null);
      setLoseCondition(null);
      setLeadDialogues(null);
      setEventSelectionMode('random');
      setEventSequence([]);
      setEvents([]);
      return;
    }

    let isMounted = true;
    (async () => {
      setOperation('loading');
      setStatus(null); // Clear any previous errors
      try {
        const config = await fetchIndustryConfig(industryId);
        if (!isMounted) return;
        
        if (!config) {
          // Config doesn't exist yet - this is OK, will use defaults
          setStatus({ type: 'success', message: 'No config found. Using defaults.' });
          setOperation('idle');
          return;
        }
        
        if (config.businessMetrics) setBusinessMetrics(config.businessMetrics);
        if (config.businessStats) setBusinessStats(config.businessStats);
        
        // Load map config from separate fields (no JSON parsing!)
        if (config.mapConfig) {
          setMapWidth(config.mapConfig.width);
          setMapHeight(config.mapConfig.height);
          setMapWalls(config.mapConfig.walls || []);
        }
        
        // Load layout config from separate fields (no JSON parsing!)
        if (config.layoutConfig) {
          setEntryPosition(config.layoutConfig.entryPosition || null);
          setWaitingPositions(config.layoutConfig.waitingPositions || []);
          setServiceRooms(config.layoutConfig.serviceRooms || []);
          setStaffPositions(config.layoutConfig.staffPositions || []);
          setMainCharacterPosition(config.layoutConfig.mainCharacterPosition || null);
          // Handle sprite image: explicitly check for string value, use empty string if undefined/null
          // This ensures the input field always has a value (empty string or the actual value)
          const spriteImage = config.layoutConfig.mainCharacterSpriteImage;
          if (typeof spriteImage === 'string') {
            setMainCharacterSpriteImage(spriteImage);
          } else {
            setMainCharacterSpriteImage('');
          }
        } else {
          // If layoutConfig doesn't exist, set to empty string
          setMainCharacterSpriteImage('');
        }
        
        // Handle capacityImage: set to empty string if null/undefined, otherwise use the value
        setCapacityImage(config.capacityImage ?? '');
        if (config.winCondition) setWinCondition(config.winCondition);
        if (config.loseCondition) setLoseCondition(config.loseCondition);
        if (config.leadDialogues) setLeadDialogues(config.leadDialogues);
        else setLeadDialogues(null);

        // Load event sequencing from simulation config
        setEventSelectionMode(config.eventSelectionMode ?? 'random');
        setEventSequence(config.eventSequence ?? []);

        // customerImages and staffNamePool removed - they're global only

        // Load events for sequencing
        try {
          const eventsData = await fetchEvents(industryId);
          if (eventsData) {
            const sortedEvents = eventsData
              .slice()
              .sort((a, b) => a.title.localeCompare(b.title))
              .map(event => ({ id: event.id, title: event.title }));
            setEvents(sortedEvents);
          }
        } catch (eventsErr) {
          console.error('Failed to load events for sequencing', eventsErr);
          // Don't fail the whole load if events fail
        }
        
        if (isMounted) {
          setStatus({ type: 'success', message: 'Config loaded successfully' });
        }
      } catch (err) {
        console.error(`Failed to load industry simulation config for "${industryId}"`, err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load config';
          setStatus({ type: 'error', message: `Failed to load config: ${errorMessage}` });
        }
      } finally {
        if (isMounted) {
          setOperation('idle');
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [industryId]);

  const save = useCallback(async () => {
    if (!industryId) {
      setStatus({ type: 'error', message: 'No industry selected' });
      return;
    }

    setStatus(null);
    setOperation('saving');

    try {
      // Validate data before saving
      if (mapWidth !== null && (mapWidth < 1 || !Number.isFinite(mapWidth))) {
        setStatus({ type: 'error', message: 'Map width must be a positive number' });
        setOperation('idle');
        return;
      }
      
      if (mapHeight !== null && (mapHeight < 1 || !Number.isFinite(mapHeight))) {
        setStatus({ type: 'error', message: 'Map height must be a positive number' });
        setOperation('idle');
        return;
      }

      // Save all fields directly - no JSON parsing needed!
      const result = await upsertIndustryConfig(industryId, {
        businessMetrics: businessMetrics ?? undefined,
        businessStats: businessStats ?? undefined,
        // Movement removed - it's global only
        mapWidth: mapWidth ?? null,
        mapHeight: mapHeight ?? null,
        mapWalls: mapWalls.length > 0 ? mapWalls : null,
        entryPosition: entryPosition ?? null,
        waitingPositions: waitingPositions.length > 0 ? waitingPositions : null,
        serviceRooms: serviceRooms.length > 0 ? serviceRooms : null,
        staffPositions: staffPositions.length > 0 ? staffPositions : null,
        mainCharacterPosition: mainCharacterPosition || null,
        mainCharacterSpriteImage: mainCharacterSpriteImage || null,
        capacityImage: capacityImage || null,
        winCondition: winCondition ?? undefined,
        loseCondition: loseCondition ?? undefined,
        leadDialogues: leadDialogues && leadDialogues.length > 0 ? leadDialogues.filter(d => d.trim() !== '') : null,
        // Event sequencing
        eventSelectionMode: eventSelectionMode,
        eventSequence: eventSequence,
        // customerImages and staffNamePool removed - they're global only
      });

      // Event sequencing is now saved as part of the industry simulation config

      if (result.success) {
        setStatus({ type: 'success', message: 'Config saved successfully!' });
      } else {
        const errorMsg = result.message || 'Failed to save config';
        setStatus({ type: 'error', message: errorMsg });
      }
    } catch (err) {
      console.error(`Failed to save industry simulation config for "${industryId}"`, err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save config';
      setStatus({ type: 'error', message: `Failed to save config: ${errorMessage}` });
    } finally {
      setOperation('idle');
    }
  }, [
    industryId,
    businessMetrics,
    businessStats,
    mapWidth,
    mapHeight,
    mapWalls,
    entryPosition,
    waitingPositions,
    serviceRooms,
    staffPositions,
    mainCharacterPosition,
    mainCharacterSpriteImage,
    capacityImage,
    winCondition,
    loseCondition,
    leadDialogues,
    eventSelectionMode,
    eventSequence,
  ]);

  const updateMetrics = useCallback((updates: Partial<BusinessMetrics>) => {
    setBusinessMetrics((prev) => {
      const current = prev || {
        startingCash: 0,
        monthlyExpenses: 0,
        startingExp: 0, // Previously: startingSkillLevel
        startingFreedomScore: 0, // Previously: founderWorkHours
      };
      return { ...current, ...updates };
    });
  }, []);

  const updateStats = useCallback((updates: Partial<BusinessStats>) => {
    setBusinessStats((prev) => {
      const current = prev || {
        ticksPerSecond: 10,
        monthDurationSeconds: 60,
        customerSpawnIntervalSeconds: 3,
        customerPatienceSeconds: 10,
        leavingAngryDurationTicks: 10,
        customerSpawnPosition: { x: 4, y: 9 },
        serviceCapacity: 2,
        expGainPerHappyCustomer: 1, // Previously: skillLevelGainPerHappyCustomer
        expLossPerAngryCustomer: 1, // Previously: skillLevelLossPerAngryCustomer
        // baseHappyProbability removed - not used in game mechanics
        eventTriggerSeconds: [],
        serviceRevenueMultiplier: 1,
        serviceRevenueScale: 10,
      };
      return { ...current, ...updates };
    });
  }, []);

  const updateWinCondition = useCallback((updates: Partial<WinCondition>) => {
    setWinCondition((prev) => {
      const current = prev || {
        cashTarget: 50000,
      };
      return { ...current, ...updates };
    });
  }, []);

  const updateLoseCondition = useCallback((updates: Partial<LoseCondition>) => {
    setLoseCondition((prev) => {
      const current = prev || {
        cashThreshold: 0,
        timeThreshold: 0,
      };
      return { ...current, ...updates };
    });
  }, []);

  return {
    // Data
    businessMetrics,
    businessStats,
    mapWidth,
    mapHeight,
    mapWalls,
    entryPosition,
    waitingPositions,
    serviceRooms,
    staffPositions,
    mainCharacterPosition,
    mainCharacterSpriteImage,
    capacityImage,
    winCondition,
    loseCondition,
    leadDialogues,
    eventSelectionMode,
    eventSequence,
    events,
    // Setters
    setBusinessMetrics,
    setBusinessStats,
    setMapWidth,
    setMapHeight,
    setMapWalls,
    setEntryPosition,
    setWaitingPositions,
    setServiceRooms,
    setStaffPositions,
    setMainCharacterPosition,
    setMainCharacterSpriteImage,
    setCapacityImage,
    setWinCondition,
    setLoseCondition,
    setLeadDialogues,
    setEventSelectionMode,
    setEventSequence,
    // Update helpers
    updateMetrics,
    updateStats,
    updateWinCondition,
    updateLoseCondition,
    // Operations
    operation,
    status,
    save,
  };
}

